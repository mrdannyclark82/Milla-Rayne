import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
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
 * Generates speech from text using the Azure Text-to-Speech API and saves it to a public file.
 * @param text The text to convert to speech.
 * @param voiceName The voice name to use (e.g., 'en-US-JennyNeural').
 * @param voiceConfig Voice configuration (rate, pitch).
 * @returns The file path of the generated audio file (relative to public dir) or null if failed.
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

  // Create a hash of the text + voice settings to use as cache key
  const rate = voiceConfig.rate ?? 1.0;
  const pitch = voiceConfig.pitch ?? 1.0;

  const cacheKey = crypto
    .createHash('sha256')
    .update(`${text}:${voiceName}:${rate}:${pitch}`)
    .digest('hex');

  // Check cache first
  const cachedFile = speechCache.get(cacheKey);
  if (cachedFile) {
    console.log(`Azure TTS cache hit for text: "${text.substring(0, 50)}..."`);

    // Verify file still exists
    const audioDir = path.resolve(process.cwd(), 'client', 'public', 'audio');
    const audioFilePath = path.join(
      audioDir,
      cachedFile.replace('/audio/', '')
    );

    if (fs.existsSync(audioFilePath)) {
      return cachedFile;
    } else {
      // File was deleted, remove from cache
      console.log(`Cached file no longer exists, regenerating...`);
      speechCache.delete(cacheKey);
    }
  }

  console.log(`Azure TTS cache miss for text: "${text.substring(0, 50)}..."`);

  const audioDir = path.resolve(process.cwd(), 'client', 'public', 'audio');

  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // Use hash as filename for consistent cache hits
  const audioFileName = `azure_${cacheKey}.mp3`;
  const audioFilePath = path.join(audioDir, audioFileName);

  return new Promise((resolve, reject) => {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        config.azure.ttsApiKey as string,
        config.azure.ttsRegion as string
      );

      speechConfig.speechSynthesisVoiceName = voiceName;
      speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

      const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFilePath);
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      // Create SSML to handle pitch and rate
      const ssmlRate = rate !== 1.0 ? `${(rate * 100).toFixed(0)}%` : '+0%';
      // Azure pitch range is relative. Mapping 1.0 -> 0Hz (default), >1.0 -> +%, <1.0 -> -%
      // A simple mapping: 0.5 -> -50%, 1.5 -> +50%.
      const pitchPercentage = (pitch - 1.0) * 100;
      const ssmlPitch = pitchPercentage >= 0 ? `+${pitchPercentage.toFixed(0)}%` : `${pitchPercentage.toFixed(0)}%`;

      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voiceName}">
            <prosody rate="${ssmlRate}" pitch="${ssmlPitch}">
                ${text}
            </prosody>
        </voice>
      </speak>`;

      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          synthesizer.close();
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            const publicUrl = `/audio/${audioFileName}`;
            speechCache.set(cacheKey, publicUrl);
            resolve(publicUrl);
          } else {
            console.error(
              `Azure TTS Synthesis failed. Reason: ${result.reason}, Details: ${result.errorDetails}`
            );
            resolve(null);
          }
        },
        (error) => {
          synthesizer.close();
          console.error(`Azure TTS Synthesizer error:`, error);
          resolve(null);
        }
      );
    } catch (error) {
      console.error('Error generating Azure TTS:', error);
      resolve(null);
    }
  });
}
