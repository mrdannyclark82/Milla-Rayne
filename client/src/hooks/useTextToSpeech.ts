import { useState, useEffect, useRef } from 'react';

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  isSpeaking: boolean;
  isSupported: boolean;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    const handleStart = () => setIsSpeaking(true);
    const handleEnd = () => setIsSpeaking(false);
    const handleError = () => setIsSpeaking(false);

    // Listen for speechSynthesis events
    if (utteranceRef.current) {
      utteranceRef.current.addEventListener('start', handleStart);
      utteranceRef.current.addEventListener('end', handleEnd);
      utteranceRef.current.addEventListener('error', handleError);
    }

    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.removeEventListener('start', handleStart);
        utteranceRef.current.removeEventListener('end', handleEnd);
        utteranceRef.current.removeEventListener('error', handleError);
      }
    };
  }, [isSupported]);

  const speak = (text: string) => {
    if (!isSupported || !text.trim()) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure voice settings
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1.1; // Slightly higher pitch for more pleasant female voice
    utterance.volume = 0.8;

    // Try to use a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('karen') ||
      voice.name.toLowerCase().includes('susan')
    );

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.addEventListener('start', () => setIsSpeaking(true));
    utterance.addEventListener('end', () => setIsSpeaking(false));
    utterance.addEventListener('error', () => setIsSpeaking(false));

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const pause = () => {
    if (isSupported) {
      window.speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  };

  return {
    speak,
    isSpeaking,
    isSupported,
    stop,
    pause,
    resume,
  };
};