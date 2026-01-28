/**
 * MediaPipe Integration Example
 * 
 * Example component demonstrating how to use the MediaPipe GenAI wrapper
 * for multimodal tasks like vision and audio processing.
 */

import { useState } from 'react';
import { genai } from '../mediapipe-genai';

export function MediaPipeExample() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Initialize MediaPipe if not already done
      await genai.init();

      // Analyze the uploaded image
      const analysis = await genai.analyzeImage(file, 'Describe this image in detail');
      setResult(analysis);
    } catch (error) {
      console.error('Image analysis failed:', error);
      setResult('Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Initialize MediaPipe if not already done
      await genai.init();

      // Transcribe the audio
      const transcript = await genai.audioToText(file);
      setResult(transcript);
    } catch (error) {
      console.error('Audio transcription failed:', error);
      setResult('Failed to transcribe audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mediapipe-example p-4 space-y-4">
      <h2 className="text-2xl font-bold">MediaPipe GenAI Demo</h2>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Vision: Upload Image for Analysis</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Audio: Upload Audio for Transcription</h3>
        <input
          type="file"
          accept="audio/*"
          onChange={handleAudioUpload}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Processing...</p>
        </div>
      )}

      {result && !loading && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h4 className="font-semibold mb-2">Result:</h4>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}
