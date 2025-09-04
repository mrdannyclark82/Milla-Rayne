import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechSynthesisHookOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface SpeechSynthesisHookReturn {
  speak: (text: string) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  speaking: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  voice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const DEFAULT_OPTIONS: Required<SpeechSynthesisHookOptions> = {
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 0.8,
};

export const useSpeechSynthesis = (options: SpeechSynthesisHookOptions = {}): SpeechSynthesisHookReturn => {
  const { voice: defaultVoice, rate: defaultRate, pitch: defaultPitch, volume: defaultVolume } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(defaultVoice);
  const [rate, setRate] = useState(defaultRate);
  const [pitch, setPitch] = useState(defaultPitch);
  const [volume, setVolume] = useState(defaultVolume);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check for browser support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  // Load available voices
  useEffect(() => {
    if (!supported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      
      // Only update if voices actually changed to reduce re-renders
      if (availableVoices.length !== voices.length) {
        setVoices(availableVoices);
        
        // Only log once when voices first load
        if (voices.length === 0 && availableVoices.length > 0) {
          console.log('Available voices:', availableVoices.map(v => ({ name: v.name, lang: v.lang, gender: v.name.toLowerCase() })));
        }
      }
      
      // Auto-select a female English voice if no voice is set
      if (!voice && availableVoices.length > 0) {
        // Enhanced female voice detection - looking for more patterns
        const femaleVoice = availableVoices.find(v => {
          const name = v.name.toLowerCase();
          const lang = v.lang.toLowerCase();
          return lang.startsWith('en') && (
            name.includes('female') || 
            name.includes('woman') || 
            name.includes('zira') || 
            name.includes('hazel') ||
            name.includes('susan') ||
            name.includes('karen') ||
            name.includes('samantha') ||
            name.includes('allison') ||
            name.includes('ava') ||
            name.includes('serena') ||
            name.includes('fiona') ||
            name.includes('tessa') ||
            name.includes('kate') ||
            name.includes('vicky') ||
            name.includes('aria') ||
            name.includes('jenny') ||
            name.includes('emily') ||
            name.includes('sarah') ||
            name.includes('anna') ||
            // Common patterns in voice names
            name.includes('f ') || // Female marker
            (name.includes('us') && name.includes('female')) ||
            (name.includes('gb') && name.includes('female'))
          );
        });
        
        // If no explicitly female voice found, prefer voices that typically sound more feminine
        const preferredVoice = femaleVoice || availableVoices.find(v => {
          const name = v.name.toLowerCase();
          return v.lang.startsWith('en') && (
            name.includes('natural') ||
            name.includes('neural') ||
            name.includes('enhanced') ||
            name.includes('premium')
          );
        });
        
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
        const selectedVoice = preferredVoice || englishVoice || availableVoices[0];
        
        // Only log once to reduce console spam
        if (voices.length === 0 && selectedVoice) {
          console.log('Selected voice for Milla:', selectedVoice?.name, selectedVoice?.lang);
        }
        setVoice(selectedVoice);
      }
    };

    // Load voices only once to prevent excessive calls
    if (voices.length === 0) {
      loadVoices();
    }
    
    // Only listen for voice changes if we have no voices yet
    let cleanup: (() => void) | undefined;
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      cleanup = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
    
    return cleanup;
  }, [supported]);

  // Speak function
  const speak = useCallback((text: string) => {
    if (!supported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utterance.onpause = () => setSpeaking(false);
    utterance.onresume = () => setSpeaking(true);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [supported, voice, rate, pitch, volume]);

  // Control functions
  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setSpeaking(false);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setSpeaking(true);
  }, [supported]);

  return {
    speak,
    cancel,
    pause,
    resume,
    speaking,
    supported,
    voices,
    voice,
    setVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
  };
};