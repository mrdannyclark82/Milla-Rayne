import React, { useState, useEffect, useMemo } from 'react';
import { voiceService } from '@/services/voiceService';
import { Button } from '@/components/ui/button';
import { VoicePickerDialog } from '@/components/VoicePickerDialog';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { VoiceControls } from '@/components/VoiceControls';
import { UnifiedSettingsMenu } from '@/components/UnifiedSettingsMenu';
import { SceneProvider } from '@/components/scene/SceneProvider';
import { useNeutralizeLegacyBackground } from '@/hooks/useNeutralizeLegacyBackground';
import {
  getPredictiveUpdatesEnabled,
  fetchDailySuggestion,
} from '@/utils/predictiveUpdatesClient';
import type {
  AppState,
  PerformanceMode,
  WeatherEffect,
  SceneLocationKey,
} from '@shared/sceneTypes';
import { FloatingInput } from '@/components/FloatingInput';
import { GuidedMeditation } from '@/components/GuidedMeditation'; // Import the new component
import { ElevenLabsVoice } from '@/types/elevenLabs';

function App() {
  console.log('App render start');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice | null>(
    null
  );
  const [availableVoices, setAvailableVoices] = useState<ElevenLabsVoice[]>([]);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceVolume, setVoiceVolume] = useState(0.8);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [lastMessage, setLastMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  const [location, setLocation] = useState<SceneLocationKey>('living_room');
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffect>('none');
  const [performanceMode, setPerformanceMode] =
    useState<PerformanceMode>('balanced');

  useNeutralizeLegacyBackground();

  useEffect(() => {
    const fetchOnLoad = async () => {
      if (getPredictiveUpdatesEnabled()) {
        try {
          const result = await fetchDailySuggestion();
          if (result.success) {
            console.log('Daily suggestion fetched:', result.suggestion);
          } else {
            console.log(
              'No daily suggestion available or error:',
              result.error
            );
          }
        } catch (error) {
          console.error('Error fetching daily suggestion on load:', error);
        }
      }
    };

    fetchOnLoad();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadVoices = async () => {
      const voices = await voiceService.getAvailableVoices();
      setAvailableVoices(voices);
      if (voices.length > 0) {
        setSelectedVoice(voices[0]);
      }
    };

    if (voiceEnabled) {
      loadVoices();
    }
  }, [voiceEnabled]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage = data.response;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantMessage },
      ]);

      if (data.sceneContext) {
        if (data.sceneContext.location) {
          setLocation(data.sceneContext.location);
        }
        if (data.sceneContext.weather) {
          setWeatherEffect(data.sceneContext.weather);
        }
      }

      if (voiceEnabled && selectedVoice) {
        speakMessage(assistantMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = (text: string) => {
    voiceService.speak(text, {
      voiceName: selectedVoice?.voice_id,
      rate: speechRate,
      pitch: voicePitch,
      volume: voiceVolume,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
    setLastMessage(text);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const appState: AppState = useMemo(() => {
    if (isListening) return 'listening';
    if (isLoading) return 'thinking';
    if (isSpeaking) return 'speaking';
    return 'idle';
  }, [isListening, isLoading, isSpeaking]);

  const getButtonSize = (): 'default' | 'sm' => 'sm';

  return (
    <SceneProvider
      location={location}
      weatherEffect={weatherEffect}
      appState={appState}
      performanceMode={performanceMode}
    >
      <div className="relative min-h-screen flex flex-col items-center justify-center p-2 sm:p-4">
        {/* Centered, floating container */}
        <div className="relative w-full max-w-2xl h-[90vh] sm:h-[75vh] flex flex-col bg-black/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Top bar with controls */}
          <div className="flex-shrink-0 p-2 sm:p-4 flex gap-2 justify-between items-center border-b border-white/10">
            <Button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              variant={voiceEnabled ? 'default' : 'outline'}
              size={getButtonSize()}
              aria-pressed={voiceEnabled}
              className="flex-1"
            >
              {voiceEnabled ? '🔊' : '🔇'} Voice {voiceEnabled ? 'On' : 'Off'}
            </Button>

            {!isMobile && (
              <Button
                onClick={toggleListening}
                variant={isListening ? 'default' : 'outline'}
                size={getButtonSize()}
                disabled={isLoading}
                className={`flex-1 ${isListening ? 'animate-pulse' : ''}`}
                aria-pressed={isListening}
              >
                {isListening ? '🎤 Listening...' : '🎙️ Speak'}
              </Button>
            )}

            <UnifiedSettingsMenu
              getButtonSize={getButtonSize}
              setShowVoicePicker={setShowVoicePicker}
              selectedVoice={selectedVoice}
              onVoiceSelect={setSelectedVoice}
              speechRate={speechRate}
              onSpeechRateChange={setSpeechRate}
              voicePitch={voicePitch}
              onVoicePitchChange={setVoicePitch}
              voiceVolume={voiceVolume}
              onVoiceVolumeChange={setVoiceVolume}
            />
          </div>

          <VoiceVisualizer
            isListening={isListening}
            isSpeaking={isSpeaking}
            className="h-16 flex-shrink-0"
          />

          <VoiceControls
            isSpeaking={isSpeaking}
            onPause={() => window.speechSynthesis.pause()}
            onResume={() => window.speechSynthesis.resume()}
            onStop={() => window.speechSynthesis.cancel()}
            onReplay={() => speakMessage(lastMessage)}
            showCaptions={showCaptions}
            onToggleCaptions={setShowCaptions}
          />

          {/* Add the GuidedMeditation component here */}
          <GuidedMeditation />

          {/* Chat message list */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center">
                Start a conversation with Milla...
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg shadow-md transition-all duration-300 ${msg.role === 'user' ? 'bg-blue-600/90 ml-auto max-w-[85%]' : 'bg-gray-700/90 mr-auto max-w-[85%]'}`}
                >
                  <p className="text-sm font-semibold mb-1 text-gray-300">
                    {msg.role === 'user' ? 'You' : 'Milla'}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          {/* FloatingInput will be positioned at the bottom of the viewport */}
        </div>

        {/* FloatingInput is now outside the main container to be fixed at the bottom */}
        <FloatingInput
          message={message}
          setMessage={setMessage}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isListening={isListening}
          toggleListening={toggleListening}
          isMobile={isMobile}
          getButtonSize={getButtonSize}
        />

        <VoicePickerDialog
          open={showVoicePicker}
          onOpenChange={setShowVoicePicker}
          selectedVoice={selectedVoice}
          onVoiceSelect={setSelectedVoice}
          speechRate={speechRate}
          onSpeechRateChange={setSpeechRate}
          voicePitch={voicePitch}
          onVoicePitchChange={setVoicePitch}
          voiceVolume={voiceVolume}
          onVoiceVolumeChange={setVoiceVolume}
        />
      </div>
    </SceneProvider>
  );
}

export default App;
