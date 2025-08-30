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
      setVoices(availableVoices);
      
      // Auto-select a female English voice if no voice is set
      if (!voice && availableVoices.length > 0) {
        const femaleVoice = availableVoices.find(
          v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('hazel'))
        );
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
        setVoice(femaleVoice || englishVoice || availableVoices[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [supported, voice]);

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