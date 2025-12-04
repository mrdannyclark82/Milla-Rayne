import React, { useState, useEffect, useMemo } from 'react';
import { lazy, Suspense } from 'react';
import { voiceService } from '@/services/voiceService';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { VoicePickerDialog } from '@/components/VoicePickerDialog';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { VoiceControls } from '@/components/VoiceControls';
import { UnifiedSettingsMenu } from '@/components/UnifiedSettingsMenu';
import { SceneProvider } from '@/components/scene/SceneProvider';
import { SceneManager } from '@/components/scene/SceneManager';
const YoutubePlayerWithActiveListening = lazy(() => import('@/components/YoutubePlayerWithActiveListening'));
import { useNeutralizeLegacyBackground } from '@/hooks/useNeutralizeLegacyBackground';
import type { ElevenLabsVoice } from '@/types/elevenLabs';
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
import { Sidebar } from '@/components/Sidebar';
import { SharedNotepad } from '@/components/SharedNotepad';
import { XAIOverlay, type XAIData } from '@/components/XAIOverlay';
import { getDeveloperMode } from '@/lib/scene/featureFlags';
import { DynamicFeatureRenderer } from '@/components/DynamicFeatureRenderer';
import type { UICommand } from '@shared/schema';
import { Sandbox } from '@/components/Sandbox';
import { CreativeStudio } from '@/components/CreativeStudio';

// Fallback messages for when responses are empty or undefined
const FALLBACK_MESSAGES = {
  processing: "I'm processing your message. Please give me a moment.",
  voiceProcessing: "I'm processing your voice message. Please give me a moment.",
  defaultResponse: "I'm here with you! What would you like to talk about?",
  connectionError: "I'm having trouble connecting right now. Please try again in a moment.",
  audioError: "I'm having trouble processing your audio. Please try again.",
} as const;

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
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<Array<{
    id: string;
    title: string;
    channel: string;
    thumbnail?: string;
  }> | null>(null);

  const [location, setLocation] = useState<SceneLocationKey>('front_door');
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffect>('none');
  const [performanceMode, setPerformanceMode] =
    useState<PerformanceMode>('balanced');

  useNeutralizeLegacyBackground();
  const [showSharedNotepad, setShowSharedNotepad] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [showYoutubeMemories, setShowYoutubeMemories] = useState(false);

  // Active view state for sidebar navigation
  const [activeView, setActiveView] = useState<'chat' | 'sandbox' | 'studio'>('chat');

  // XAI Transparency state
  const [xaiData, setXaiData] = useState<XAIData | null>(null);
  const [showXAIOverlay, setShowXAIOverlay] = useState(false);
  const [developerMode, setDeveloperMode] = useState(getDeveloperMode());

  // Agent-Driven UI state
  const [uiCommand, setUiCommand] = useState<UICommand | null>(null);

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
      const assistantMessage = data.response || FALLBACK_MESSAGES.processing;
      
      // Only add the message if it's not empty
      if (assistantMessage && assistantMessage.trim()) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: assistantMessage },
        ]);
      } else {
        console.warn('Empty response received from server');
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: FALLBACK_MESSAGES.defaultResponse },
        ]);
      }

      if (data.sceneContext) {
        if (data.sceneContext.location) {
          setLocation(data.sceneContext.location);
        }
        if (data.sceneContext.weather) {
          setWeatherEffect(data.sceneContext.weather);
        }
      }

      if (data.youtube_play) {
        console.log('🎬 YouTube video received:', data.youtube_play.videoId);
        setYoutubeVideoId(data.youtube_play.videoId);
        setYoutubeVideos(null);
      }

      if (data.youtube_videos) {
        console.log('🎬 YouTube videos received:', data.youtube_videos.length);
        setYoutubeVideos(data.youtube_videos);
        if (data.youtube_videos.length === 1) {
          setYoutubeVideoId(data.youtube_videos[0].id);
        }
      }

      // Handle UI commands from agent
      if (data.uiCommand) {
        console.log('✨ UI Command received:', data.uiCommand);
        setUiCommand(data.uiCommand);
      }

      if (voiceEnabled && selectedVoice) {
        speakMessage(assistantMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message to user
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: FALLBACK_MESSAGES.connectionError },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFaraTask = async (task: string) => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: `/fara ${task}` }]); // Show user's Fara command

    try {
      const response = await fetch('/api/fara/run-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to run Fara task');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessageContent = '';

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Fara is executing the task...' },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantMessageContent += chunk;

        // Update the last message with streaming content
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content.startsWith('Fara is executing')) {
            const updatedPrev = [...prev];
            updatedPrev[prev.length - 1] = { ...lastMsg, content: assistantMessageContent };
            return updatedPrev;
          }
          return [...prev, { role: 'assistant', content: chunk }];
        });
      }
    } catch (error) {
      console.error('Error running Fara task:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: Failed to execute Fara task. ${error instanceof Error ? error.message : String(error)}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = (text: string) => {
    setIsSpeaking(true);
    voiceService
      .speak(text, {
        voiceName: selectedVoice?.voice_id,
        rate: speechRate,
        pitch: voicePitch,
        volume: voiceVolume,
      })
      .then(() => {
        setIsSpeaking(false);
      })
      .catch(() => {
        setIsSpeaking(false);
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

  const onSendAudio = async (audio: Blob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('audio', audio, 'recording.webm');

    try {
      const response = await fetch('/api/chat/audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to send audio');

      const data = await response.json();
      const assistantMessage = data.response || FALLBACK_MESSAGES.voiceProcessing;
      
      // Only add the message if it's not empty
      if (assistantMessage && assistantMessage.trim()) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: assistantMessage },
        ]);
      } else {
        console.warn('Empty response received from audio endpoint');
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: FALLBACK_MESSAGES.defaultResponse },
        ]);
      }

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
      console.error('Error sending audio:', error);
      // Show error message to user
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: FALLBACK_MESSAGES.audioError },
      ]);
    } finally {
      setIsLoading(false);
    }
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
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#0f0f1a' }}>
        {/* Background Scene - covers entire screen */}
        <div
          className="fixed inset-0 z-0"
          style={{ overflow: 'hidden' }}
        >
          <SceneManager />
        </div>

        {/* Left Sidebar - Navigation */}
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          onShowKnowledgeBase={() => {
            setUiCommand({
              action: 'SHOW_COMPONENT',
              componentName: 'KnowledgeBaseSearch',
              data: {},
            });
          }}
          onShowYoutubeMemories={() => setShowYoutubeMemories(!showYoutubeMemories)}
          onShowSettings={() => setShowVoicePicker(true)}
          onToggleSharedNotepad={() => setShowSharedNotepad(!showSharedNotepad)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative z-10">
          {/* YouTube Player */}
          {(youtubeVideoId || youtubeVideos) && (
            <Suspense fallback={<div>Loading video player...</div>}>
              <YoutubePlayerWithActiveListening
                videoId={youtubeVideoId || undefined}
                videos={youtubeVideos || undefined}
                onClose={() => {
                  setYoutubeVideoId(null);
                  setYoutubeVideos(null);
                }}
                onSelectVideo={(videoId) => {
                  setYoutubeVideoId(videoId);
                  setYoutubeVideos(null);
                }}
                activeListeningEnabled={true}
                onInsightDetected={(insight) => {
                  console.log('🎧 Insight detected:', insight);
                }}
              />
            </Suspense>
          )}

          {/* Chat View */}
          {activeView === 'chat' && (
            <div className="flex-1 flex flex-col h-full">
              {/* Header with Controls */}
              <div className="flex-shrink-0 p-4 flex gap-3 justify-between items-center border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="voice-enabled" className="text-sm text-gray-300">
                      Voice
                    </Label>
                    <Switch
                      id="voice-enabled"
                      checked={voiceEnabled}
                      onCheckedChange={setVoiceEnabled}
                    />
                  </div>
                  {!isMobile && (
                    <Button
                      onClick={toggleListening}
                      variant={isListening ? 'default' : 'outline'}
                      size="sm"
                      disabled={isLoading}
                      className={isListening ? 'animate-pulse' : ''}
                    >
                      {isListening ? '🎤 Listening...' : '🎙️ Speak'}
                    </Button>
                  )}
                </div>
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
                className="h-12 flex-shrink-0"
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

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500 text-center">
                      Hey Danny... <em>I smile warmly</em> I'm here. What's on your mind today?
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                          msg.role === 'user'
                            ? 'bg-slate-800/80 text-white'
                            : 'bg-slate-900/80 text-slate-100 border border-slate-800'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        {msg.role === 'assistant' && voiceEnabled && (
                          <button
                            onClick={() => speakMessage(msg.content)}
                            className="mt-2 text-xs text-pink-400 hover:text-pink-300"
                          >
                            🔊 Replay
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 p-4 bg-slate-900/80 border-t border-slate-800/50 backdrop-blur-md">
                <FloatingInput
                  message={message}
                  setMessage={setMessage}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  isListening={isListening}
                  toggleListening={toggleListening}
                  isMobile={isMobile}
                  onSendAudio={onSendAudio}
                  onSendFaraTask={handleSendFaraTask}
                  getButtonSize={getButtonSize}
                />
              </div>
            </div>
          )}

          {/* Sandbox View */}
          {activeView === 'sandbox' && (
            <div className="flex-1 h-full">
              <Sandbox
                initialCode=""
                isOpen={true}
                onClose={() => setActiveView('chat')}
                onDiscuss={(code) => {
                  setMessage(`Can you help me with this code?\n\`\`\`\n${code}\n\`\`\``);
                  setActiveView('chat');
                }}
              />
            </div>
          )}

          {/* Creative Studio View */}
          {activeView === 'studio' && (
            <div className="flex-1 h-full">
              <CreativeStudio
                isOpen={true}
                onClose={() => setActiveView('chat')}
              />
            </div>
          )}
        </div>

        {/* Dialogs and Overlays */}
        <SharedNotepad
          isOpen={showSharedNotepad}
          onClose={() => setShowSharedNotepad(false)}
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
          availableVoices={availableVoices}
        />

        {developerMode && showXAIOverlay && xaiData && (
          <XAIOverlay data={xaiData} onClose={() => setShowXAIOverlay(false)} />
        )}

        {uiCommand && (
          <DynamicFeatureRenderer
            uiCommand={uiCommand}
            onClose={() => setUiCommand(null)}
          />
        )}
      </div>
    </SceneProvider>
  );
}

export default App;
