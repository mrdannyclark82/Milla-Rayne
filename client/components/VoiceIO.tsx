/**
 * Voice Input/Output Component
 * Handles voice recording, transcription, and speech synthesis
 * Integrated with Expo Speech (or Web Speech API for browser)
 */

import React, { useState, useEffect, useRef } from 'react';

interface VoiceIOProps {
  onTranscript?: (text: string) => void;
  onError?: (error: Error) => void;
  autoSpeak?: boolean;
  language?: string;
}

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}

export const VoiceIO: React.FC<VoiceIOProps> = ({
  onTranscript,
  onError,
  autoSpeak = false,
  language = 'en-US',
}) => {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    error: null,
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;

        recognitionRef.current.onresult = handleRecognitionResult;
        recognitionRef.current.onerror = handleRecognitionError;
        recognitionRef.current.onend = handleRecognitionEnd;
      } else {
        console.warn('Speech recognition not supported in this browser');
      }

      // Initialize speech synthesis
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [language]);

  const handleRecognitionResult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join('');

    setState(prev => ({ ...prev, transcript }));

    if (event.results[0].isFinal) {
      if (onTranscript) {
        onTranscript(transcript);
      }
    }
  };

  const handleRecognitionError = (event: any) => {
    const error = new Error(`Speech recognition error: ${event.error}`);
    setState(prev => ({
      ...prev,
      error: error.message,
      isListening: false,
    }));
    if (onError) {
      onError(error);
    }
  };

  const handleRecognitionEnd = () => {
    setState(prev => ({ ...prev, isListening: false }));
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setState(prev => ({
        ...prev,
        isListening: true,
        transcript: '',
        error: null,
      }));
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speak = (text: string, voice?: SpeechSynthesisVoice) => {
    if (!synthRef.current) {
      console.warn('Speech synthesis not available');
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true }));
    };

    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setState(prev => ({ ...prev, isSpeaking: false }));
    };

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  };

  return (
    <div className="voice-io p-4 bg-white rounded-lg shadow-md">
      <div className="header mb-4">
        <h3 className="text-lg font-bold text-gray-800">Voice I/O</h3>
        <p className="text-xs text-gray-500">Speech recognition & synthesis</p>
      </div>

      <div className="controls flex gap-3 mb-4">
        <button
          onClick={state.isListening ? stopListening : startListening}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
            state.isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          disabled={state.isSpeaking}
        >
          {state.isListening ? (
            <>
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span>
              Stop Listening
            </>
          ) : (
            '🎤 Start Listening'
          )}
        </button>

        {state.isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
          >
            🔇 Stop Speaking
          </button>
        )}
      </div>

      {state.transcript && (
        <div className="transcript bg-gray-50 p-3 rounded-md mb-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Transcript:</p>
          <p className="text-sm text-gray-800">{state.transcript}</p>
        </div>
      )}

      {state.error && (
        <div className="error bg-red-50 border border-red-200 p-3 rounded-md">
          <p className="text-xs font-semibold text-red-600 mb-1">Error:</p>
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      <div className="status flex items-center gap-2 text-xs text-gray-500">
        <div className={`w-2 h-2 rounded-full ${
          state.isListening ? 'bg-green-500' : state.isSpeaking ? 'bg-blue-500' : 'bg-gray-300'
        }`}></div>
        <span>
          {state.isListening
            ? 'Listening...'
            : state.isSpeaking
            ? 'Speaking...'
            : 'Ready'}
        </span>
      </div>
    </div>
  );
};

export default VoiceIO;
