import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { LRUCache } from 'lru-cache';
import { config } from '../config';

// Cache for generated speech files (500 files, ~50MB max, 7-day TTL)
const speechCache = new LRUCache<string, string>({
  max: 500,
  maxSize: 50 * 1024 * 1024, // 50MB max cache size
  sizeCalculation: () => 10 * 1024, // ~10KB per audio file average
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});

interface AzureTtsConfig {
  rate?: number;
  pitch?: number;
}

/**
 * Generates speech from text using the Azure Cognitive Services TTS API and saves it to a public file.
 * @param text The text to convert to speech.
 * @param voiceName The voice name to use (e.g., 'en-US-JennyNeural').
 * @param voiceConfig Voice configuration (rate, pitch).
 * @returns The public URL of the generated audio file (relative to public dir) or null if failed.
 */
export async function generateAzureSpeech(
  text: string,
  voiceName: string = 'en-US-JennyNeural',
  voiceConfig: AzureTtsConfig = {}
): Promise<string | null> {
  if (!config.azure.ttsApiKey) {
    console.error('Azure TTS API key is not configured.');
    return null;
  }

  const region = config.azure.ttsRegion || 'eastus';
  const rate = voiceConfig.rate ?? 1.0;
  const pitch = voiceConfig.pitch ?? 1.0; // 1.0 is normal pitch in our internal config

  // Create a hash of the text + voice settings to use as cache key
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${text}:${voiceName}:${rate}:${pitch}:azure`)
    .digest('hex');

  // Check cache first
  const cachedFile = speechCache.get(cacheKey);
  if (cachedFile) {
    console.log(`[Azure] TTS cache hit for text: "${text.substring(0, 50)}..."`);

    // Verify file still exists
    const audioDir = path.resolve(process.cwd(), 'client', 'public', 'audio', 'azure');
    const fileName = cachedFile.split('/').pop();

    if (fileName) {
        const audioFilePath = path.join(audioDir, fileName);
        if (fs.existsSync(audioFilePath)) {
          return cachedFile;
        } else {
          // File was deleted, remove from cache
          console.log(`[Azure] Cached file no longer exists, regenerating...`);
          speechCache.delete(cacheKey);
        }
    }
  }

  console.log(`[Azure] TTS cache miss for text: "${text.substring(0, 50)}..."`);

  // Construct SSML
  // Convert rate/pitch to Azure format
  // Rate: 0.5 to 2.0 -> percentage. (rate - 1) * 100.
  // Pitch: 0.0 to 2.0 -> percentage. (pitch - 1) * 100.

  // Ensure strict SSML valid values
  const ratePct = Math.round((rate - 1.0) * 100);
  const pitchPct = Math.round((pitch - 1.0) * 100);

  const rateStr = ratePct >= 0 ? `+${ratePct}%` : `${ratePct}%`;
  const pitchStr = pitchPct >= 0 ? `+${pitchPct}%` : `${pitchPct}%`;

  const ssml = `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' xml:gender='Female' name='${voiceName}'><prosody rate='${rateStr}' pitch='${pitchStr}'>${text}</prosody></voice></speak>`;

  try {
    const response = await fetch(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': config.azure.ttsApiKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
            'User-Agent': 'Milla'
        },
        body: ssml,
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error(
        `[Azure] TTS API request failed with status: ${response.status} - ${errorText}`
        );
        return null;
    }

    const audioBuffer = await response.buffer();
    const audioDir = path.resolve(process.cwd(), 'client', 'public', 'audio', 'azure');

    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    // Use hash as filename for consistent cache hits
    const audioFileName = `${cacheKey}.mp3`;
    const audioFilePath = path.join(audioDir, audioFileName);

    fs.writeFileSync(audioFilePath, audioBuffer);

    // Return URL path relative to public
    const publicUrl = `/audio/azure/${audioFileName}`;

    // Store in cache
    speechCache.set(cacheKey, publicUrl);

    return publicUrl;
  } catch (error) {
      console.error('[Azure] Service error:', error);
      return null;
  }
}
