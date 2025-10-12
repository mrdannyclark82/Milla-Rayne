import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Default voice, can be changed

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

  const audioFileName = `${uuidv4()}.mp3`;
  const audioFilePath = path.join(audioDir, audioFileName);

  fs.writeFileSync(audioFilePath, audioBuffer);

  return `/audio/${audioFileName}`;
}
