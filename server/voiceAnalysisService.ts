import axios from 'axios';
import { config } from './config';

export interface VoiceAnalysisResult {
  text: string;
  emotionalTone: 'positive' | 'negative' | 'neutral' | 'unknown';
  success: boolean;
  error?: string;
}

/**
 * Analyzes voice input for transcription and emotional tone.
 * Uses Google Cloud Speech-to-Text and Natural Language API.
 */
export async function analyzeVoiceInput(
  audioBuffer: Buffer,
  mimeType: string
): Promise<VoiceAnalysisResult> {
  if (!config.google.apiKey) {
    return {
      text: '',
      emotionalTone: 'unknown',
      success: false,
      error: 'Google API Key not configured for voice analysis.',
    };
  }

  try {
    // Step 1: Speech-to-Text Transcription
    const speechToTextResponse = await axios.post(
      `https://speech.googleapis.com/v1/recognize?key=${process.env.GOOGLE_CLOUD_API_KEY || ''}`,
      {
        config: {
          encoding: 'LINEAR16', // Assuming common audio format, adjust if needed
          sampleRateHertz: 16000, // Adjust based on your audio
          languageCode: 'en-US',
        },
        audio: {
          content: audioBuffer.toString('base64'),
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const transcription = speechToTextResponse.data.results
      .map((result: any) => result.alternatives[0].transcript)
      .join('\n');

    if (!transcription) {
      return {
        text: '',
        emotionalTone: 'unknown',
        success: false,
        error: 'Could not transcribe audio.',
      };
    }

    // Step 2: Natural Language API for Emotional Tone Analysis
    const naturalLanguageResponse = await axios.post(
      `https://language.googleapis.com/v1/documents:analyzeSentiment?key=${process.env.GOOGLE_CLOUD_API_KEY || ''}`,
      {
        document: {
          content: transcription,
          type: 'PLAIN_TEXT',
        },
        encodingType: 'UTF8',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const sentiment = naturalLanguageResponse.data.documentSentiment;
    let emotionalTone: VoiceAnalysisResult['emotionalTone'] = 'unknown';

    if (sentiment && sentiment.score) {
      if (sentiment.score > 0.2) {
        emotionalTone = 'positive';
      } else if (sentiment.score < -0.2) {
        emotionalTone = 'negative';
      } else {
        emotionalTone = 'neutral';
      }
    }

    return {
      text: transcription,
      emotionalTone: emotionalTone,
      success: true,
    };
  } catch (error) {
    console.error('Error analyzing voice input:', error);
    return {
      text: '',
      emotionalTone: 'unknown',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
