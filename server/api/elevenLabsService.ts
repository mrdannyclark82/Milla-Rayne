import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { LRUCache } from 'lru-cache';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Default voice, can be changed

// Cache for generated speech files (500 files, ~50MB max, 7-day TTL)
const speechCache = new LRUCache<string, string>({
  max: 500,
  maxSize: 50 * 1024 * 1024, // 50MB max cache size
  sizeCalculation: () => 10 * 1024, // ~10KB per audio file average
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});

/**
 * Generates speech from text using the ElevenLabs API and saves it to a public file.
 * @param text The text to convert to speech.
 * @returns The public URL of the generated audio file.
 */
export async function generateElevenLabsSpeech(
  text: string
): Promise<string | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key is not configured.');
    return null;
  }

  // Create a hash of the text + voice settings to use as cache key
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${text}:${VOICE_ID}:eleven_monolingual_v1:0.5:0.5`)
    .digest('hex');

  // Check cache first
  const cachedFile = speechCache.get(cacheKey);
  if (cachedFile) {
    console.log(`Voice cache hit for text: "${text.substring(0, 50)}..."`);
    
    // Verify file still exists
    const audioDir = path.resolve(process.cwd(), 'client', 'public', 'audio');
    const audioFilePath = path.join(audioDir, cachedFile.replace('/audio/', ''));
    
    if (fs.existsSync(audioFilePath)) {
      return cachedFile;
    } else {
      // File was deleted, remove from cache
      console.log(`Cached file no longer exists, regenerating...`);
      speechCache.delete(cacheKey);
    }
  }

  console.log(`Voice cache miss for text: "${text.substring(0, 50)}..."`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    }
  );

  if (!response.ok) {
    console.error(
      `ElevenLabs API request failed with status: ${response.status}`
    );
    return null;
  }

  const audioBuffer = await response.buffer();
  const audioDir = path.resolve(process.cwd(), 'client', 'public', 'audio');

  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // Use hash as filename for consistent cache hits
  const audioFileName = `${cacheKey}.mp3`;
  const audioFilePath = path.join(audioDir, audioFileName);

  fs.writeFileSync(audioFilePath, audioBuffer);

  const publicUrl = `/audio/${audioFileName}`;
  
  // Store in cache
  speechCache.set(cacheKey, publicUrl);

  return publicUrl;
}

/**
 * Get cache statistics for monitoring
 */
export function getSpeechCacheStats() {
  return {
    size: speechCache.size,
    maxSize: speechCache.max,
    calculatedSize: speechCache.calculatedSize,
  };
}
