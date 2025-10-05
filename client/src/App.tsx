import React, { useState, useEffect, useRef } from 'react';
import { voiceService } from '@/services/voiceService';
import { Button } from '@/components/ui/button';
import { VoicePickerDialog } from '@/components/VoicePickerDialog';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { VoiceControls } from '@/components/VoiceControls';
import { UnifiedSettingsMenu } from '@/components/UnifiedSettingsMenu';
import { AdaptiveSceneManager } from '@/components/scene/AdaptiveSceneManager';
import { RPSceneBackgroundBridge } from '@/components/scene/RPSceneBackgroundBridge';
import { RoomOverlay } from '@/components/scene/RoomOverlay';

import { SceneLocation, SceneMood, TimeOfDay } from '@/types/scene';
import { loadSceneSettings } from '@/utils/sceneSettingsStore';
import { detectDeviceCapabilities } from '@/utils/capabilityDetector';
import { getCurrentTimeOfDay } from '@/utils/scenePresets';
import { useNeutralizeLegacyBackground } from '@/hooks/useNeutralizeLegacyBackground';
import { getPredictiveUpdatesEnabled, fetchDailySuggestion } from '@/utils/predictiveUpdatesClient';

function App() {
  console.log('App render start');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceVolume, setVoiceVolume] = useState(0.8);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [lastMessage, setLastMessage] = useState('');
  const [hasVoiceConsent, setHasVoiceConsent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Phase 3: RP scene state
  const [currentLocation, setCurrentLocation] = useState<SceneLocation>('unknown');
  const [sceneMood, setSceneMood] = useState<SceneMood>('calm');
  const [sceneSettings, setSceneSettings] = useState(() => loadSceneSettings());
  
  // Visual V1: Track time of day and reduced motion for Milla visual
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>(() => getCurrentTimeOfDay());
  const [capabilities] = useState(() => detectDeviceCapabilities());

  // Neutralize legacy background images on mount
  useNeutralizeLegacyBackground();

  // Load scene settings on mount and listen for changes
  useEffect(() => {
    const loadSettings = () => {
      setSceneSettings(loadSceneSettings());
    };
    
    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', loadSettings);
    return () => window.removeEventListener('storage', loadSettings);
  }, []);

  // Update time of day every minute for visual tints
  useEffect(() => {
    const updateTimeOfDay = () => {
      setCurrentTimeOfDay(getCurrentTimeOfDay());
    };
    
    const interval = setInterval(updateTimeOfDay, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch daily suggestion on app load if predictive updates enabled
  useEffect(() => {
    const fetchOnLoad = async () => {
      if (getPredictiveUpdatesEnabled()) {
        console.log('Predictive updates enabled - fetching daily suggestion...');
        try {
          const result = await fetchDailySuggestion();
          if (result.success) {
            console.log('Daily suggestion fetched:', result.suggestion);
          } else {
            console.log('No daily suggestion available or error:', result.error);
          }
        } catch (error) {
          console.error('Error fetching daily suggestion on load:', error);
        }
      }
    };
    
    fetchOnLoad();
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Try to select a female voice by default
      const femaleVoice = voices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('karen') ||
        v.name.toLowerCase().includes('victoria')
      );

      setSelectedVoice(femaleVoice || voices[0] || null);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Check for existing voice consent on mount
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const response = await fetch('/api/voice-consent/check/voice_synthesis');
        const data = await response.json();
        if (data.success) {
          // Voice consent checked - could be used to enable/disable voice features
          console.log('Voice consent status:', data.hasConsent);
        }
      } catch (error) {
        console.error('Error checking voice consent:', error);
      }
    };
    checkConsent();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage = data.response;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      // Phase 3: Update scene if metadata is provided
      if (data.sceneContext) {
        if (data.sceneContext.location) {
          setCurrentLocation(data.sceneContext.location);
        }
        if (data.sceneContext.mood) {
          setSceneMood(data.sceneContext.mood);
        }
      }

      // Speak the response if voice is enabled
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
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = speechRate;
    utterance.pitch = voicePitch;
    utterance.volume = voiceVolume;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    currentUtteranceRef.current = utterance;
    setLastMessage(text);
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    window.speechSynthesis.pause();
  };

  const resumeSpeech = () => {
    window.speechSynthesis.resume();
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const replaySpeech = () => {
    if (lastMessage) {
      speakMessage(lastMessage);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const cancelListening = () => {
    recognitionRef.current?.abort();
    setIsListening(false);
    setMessage('');
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      window.speechSynthesis.cancel();
    }
  };

  const getButtonSize = () => {
    return "sm";
  };

  return (
    <div className="min-h-screen">
      {/* Adaptive Scene Background - Phase 3: Now responds to RP scene location */}
      {/* Visual V1: Constrained to left 2/3 with region prop */}
      <RPSceneBackgroundBridge enabled={sceneSettings.sceneBackgroundFromRP ?? false}>
        {(rpProps) => (
          <>
            <AdaptiveSceneManager 
              mood={rpProps.mood || sceneMood}
              location={rpProps.location as SceneLocation || currentLocation}
              timeOfDay={rpProps.timeOfDay || currentTimeOfDay}
              enableAnimations={true}
              region="left-2-3"
            />
            
            {/* Room Overlays V1: Location silhouettes (between background and stage) */}
            <RoomOverlay
              enabled={sceneSettings.enabled && (sceneSettings.sceneRoomOverlaysEnabled ?? true)}
              timeOfDay={rpProps.timeOfDay || currentTimeOfDay}
              location={rpProps.location as SceneLocation || currentLocation}
              reducedMotion={capabilities.prefersReducedMotion}
            />
          </>
        )}
      </RPSceneBackgroundBridge>

      {/* Visual V1: Milla Stage - Left 2/3 of viewport */}
      {/* 
        STATIC IMAGE GUIDE - Multiple Images Per Scene:
        
        To add multiple images for different situations in a scene:
        
        1. Place images in: /client/public/assets/scenes/
        
        2. Naming convention for multiple scene variations:
           - Base: {location}.jpg (e.g., living_room.jpg)
           - Time-based: {location}-{time}.jpg (e.g., living_room-night.jpg)
           
        3. To add situation-based images (commented out - future enhancement):
           // - Action-based: {location}-{action}.jpg
           // Examples:
           // - living_room-fireplace.jpg (Milla by fireplace)
           // - living_room-couch.jpg (Milla on couch)
           // - living_room-window.jpg (Milla looking out window)
           // - kitchen-cooking.jpg (Milla cooking)
           // - kitchen-dishes.jpg (Milla doing dishes)
           // - kitchen-counter.jpg (Milla at counter)
           
        4. Current implementation uses time-of-day variants automatically.
           To enable action-based switching in the future:
           // - Modify RealisticSceneBackground.tsx to accept an 'action' prop
           // - Update getImageUrls() to try: {location}-{action}-{time}.jpg
           // - Pass action from conversation context (detected from AI response)
           
        5. Image requirements:
           - Format: JPG or PNG
           - Resolution: 1920x1080 recommended
           - Size: Under 500KB per image (optimize for web)
           
        6. Example file structure:
           /client/public/assets/scenes/
           ├── living_room.jpg              # Default living room
           ├── living_room-night.jpg        # Night variant
           ├── living_room-fireplace.jpg    # (Future) By fireplace
           ├── living_room-couch.jpg        # (Future) On couch
           ├── kitchen.jpg                  # Default kitchen
           ├── kitchen-morning.jpg          # Morning variant
           ├── kitchen-cooking.jpg          # (Future) Cooking action
           └── kitchen-dishes.jpg           # (Future) Doing dishes
           
        See STATIC_BACKGROUNDS_QUICKSTART.md for full documentation.
      */}

      {/* Chat Interface - Fixed Right Side with Background */}
      <div 
        className="w-1/3 h-screen p-6 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm border-l border-white/10"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 10
        }}
      >
        <div className="h-full flex flex-col space-y-4">
          {/* Header with Voice Toggle and Settings */}
          <div className="flex gap-2 justify-between items-center flex-shrink-0">
            <Button
              onClick={toggleVoice}
              variant={voiceEnabled ? "default" : "outline"}
              size={getButtonSize()}
              title="Toggle voice output"
              aria-label="Toggle voice output"
              aria-pressed={voiceEnabled}
              className="flex-1"
            >
              {voiceEnabled ? '🔊' : '🔇'} Voice {voiceEnabled ? 'On' : 'Off'}
            </Button>
            
            {!isMobile && (
              <Button
                onClick={toggleListening}
                variant={isListening ? "default" : "outline"}
                size={getButtonSize()}
                disabled={isLoading}
                title="Click to speak"
                className={`flex-1 ${isListening ? 'animate-pulse' : ''}`}
                aria-label={isListening ? "Stop listening" : "Start listening"}
                aria-pressed={isListening}
              >
                {isListening ? '🎤' : '🎙️'} {isListening ? 'Listening...' : 'Speak'}
              </Button>
            )}
            
            <UnifiedSettingsMenu
              getButtonSize={getButtonSize}
              setShowVoicePicker={setShowVoicePicker}
            />
          </div>

          {/* Voice Visualizer */}
          <VoiceVisualizer
            isListening={isListening}
            isSpeaking={isSpeaking}
            className="h-16 flex-shrink-0"
          />

          {/* Voice Controls */}
          <VoiceControls
            isSpeaking={isSpeaking}
            onPause={pauseSpeech}
            onResume={resumeSpeech}
            onStop={stopSpeech}
            onReplay={replaySpeech}
            showCaptions={showCaptions}
            onToggleCaptions={setShowCaptions}
          />

          {/* Messages - Takes up most of the remaining space */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 backdrop-blur-sm">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center">
                Start a conversation with Milla...
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${msg.role === 'user'
                    ? 'bg-blue-600 ml-auto max-w-[80%] text-white'
                    : 'bg-gray-700 mr-auto max-w-[80%] text-white'
                    }`}
                >
                  <p className="text-sm font-semibold mb-1 text-gray-300">
                    {msg.role === 'user' ? 'You' : 'Milla'}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                  {showCaptions && msg.role === 'assistant' && (
                    <div className="mt-2 p-2 bg-black/50 rounded text-xs border border-white/20">
                      {msg.content}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input Area - Fixed at bottom of chat */}
          <div className="flex gap-2 items-end flex-shrink-0 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 backdrop-blur-sm">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              disabled={isLoading}
              rows={3}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[60px] max-h-[200px]"
            />
            {!isMobile && (
              <Button
                onClick={toggleListening}
                variant={isListening ? "default" : "outline"}
                size="icon"
                disabled={isLoading}
                className={isListening ? 'animate-pulse' : ''}
                title={isListening ? "Stop listening" : "Start listening"}
              >
                {isListening ? '🎤' : '🎙️'}
              </Button>
            )}
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
              title="Send message"
            >
              {isLoading ? '⏳' : '📤'}
            </Button>
          </div>
        </div>
      </div>
      {/* Voice Picker Dialog */}
      <VoicePickerDialog
        open={showVoicePicker}
        onOpenChange={setShowVoicePicker}
        availableVoices={availableVoices}
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
  );
}

export default App;
