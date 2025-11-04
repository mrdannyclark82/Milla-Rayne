import React, { useState, useEffect, useMemo } from 'react';
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
import { YoutubePlayer } from '@/components/YoutubePlayer';
import { VideoAnalysisPanel } from '@/components/VideoAnalysisPanel';
import { KnowledgeBaseSearch } from '@/components/KnowledgeBaseSearch';
import { DailyNewsDigest } from '@/components/DailyNewsDigest';
import { useNeutralizeLegacyBackground } from '@/hooks/useNeutralizeLegacyBackground';
import type { ElevenLabsVoice } from '@/types/elevenLabs';
import type { VideoAnalysis, YoutubeKnowledge, DailyNewsDigest as NewsDigestType } from '@/types/millalyzer';
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
import { CentralDock } from '@/components/CentralDock';
import { SharedNotepad } from '@/components/SharedNotepad';

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

  const [lastMessage, setLastMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  // millAlyzer state
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysis | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [dailyNews, setDailyNews] = useState<NewsDigestType | null>(null);
  const [activePanel, setActivePanel] = useState<'analysis' | 'knowledge' | 'news' | null>(null);
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

      // millAlyzer integration - check for video analysis
      if (data.videoAnalysis) {
        console.log('🔍 Video analysis received:', data.videoAnalysis);
        setCurrentAnalysis(data.videoAnalysis);
        setActivePanel('analysis');
      }

      // Check for daily news digest
      if (data.dailyNews) {
        console.log('📰 Daily news digest received');
        setDailyNews(data.dailyNews);
        setActivePanel('news');
      }

      // Check for knowledge base trigger
      if (data.showKnowledgeBase || userMessage.toLowerCase().includes('knowledge base')) {
        console.log('📚 Opening knowledge base');
        setActivePanel('knowledge');
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
    setIsSpeaking(true);
    voiceService.speak(text, {
      voiceName: selectedVoice?.voice_id,
      rate: speechRate,
      pitch: voicePitch,
      volume: voiceVolume,
    }).then(() => {
      setIsSpeaking(false);
    }).catch(() => {
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
      console.error('Error sending audio:', error);
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
      <div className="min-h-screen flex" style={{ backgroundColor: '#000' }}>
        {/* Left 2/3 - Background Image Container */}
        <div 
          className="w-2/3 h-screen"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          <SceneManager />
        </div>

        {/* Right 1/3 - Chat Interface */}
        {(youtubeVideoId || youtubeVideos) && (
          <YoutubePlayer
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
            onAnalyzeVideo={async (videoId) => {
              try {
                console.log('🔍 Analyzing video:', videoId);
                const res = await fetch('/api/youtube/analyze', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ videoId }),
                });
                const data = await res.json();
                if (data.success) {
                  setCurrentAnalysis(data.analysis);
                  setActivePanel('analysis');
                }
              } catch (error) {
                console.error('Failed to analyze video:', error);
              }
            }}
          />
        )}
        <div
          className="w-1/3 h-screen p-6 border-l border-white/10"
          style={{ 
            position: 'fixed', 
            top: 0, 
            right: 0, 
            zIndex: 10, 
            backgroundColor: '#1a1a2e', 
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" 
          }}
        >
          <div className="h-full flex flex-col space-y-4">
            <div className="flex gap-3 justify-start items-center flex-shrink-0">
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

            {/* Voice toggle centered above message thread */}
            <div className="flex justify-center items-center flex-shrink-0">
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
            </div>



            <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-lg border border-gray-700/60 shadow-inner" style={{ backgroundColor: '#4a90e2' }}>
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center">
                  Start a conversation with Milla...
                </p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl shadow-md transition-all duration-300 ${msg.role === 'user' ? 'bg-blue-600 ml-auto max-w-[85%]' : 'bg-purple-600 mr-auto max-w-[85%]'}`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold mb-1 text-white">
                        {msg.role === 'user' ? 'You' : 'Milla'}
                      </p>
                      {msg.role === 'assistant' && voiceEnabled && (
                        <Button
                          onClick={() => speakMessage(msg.content)}
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-white"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-cw"><path d="M21 2v6h-6"/><path d="M21 13a9 9 0 1 1-3-7.7L21 8"/></svg>
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-white">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
            <FloatingInput
              message={message}
              setMessage={setMessage}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isListening={isListening}
              toggleListening={toggleListening}
              onSendAudio={onSendAudio}
              isMobile={isMobile}
              getButtonSize={getButtonSize}
            />
          </div>
        </div>
        <CentralDock onToggleSharedNotepad={() => setShowSharedNotepad(!showSharedNotepad)} />
        <SharedNotepad isOpen={showSharedNotepad} onClose={() => setShowSharedNotepad(false)} />
        
        {/* millAlyzer Panels - Slide in from right */}
        {activePanel === 'analysis' && currentAnalysis && (
          <div className="fixed top-0 right-0 h-screen w-1/3 z-50 animate-in slide-in-from-right duration-300">
            <VideoAnalysisPanel
              analysis={currentAnalysis}
              onClose={() => {
                setActivePanel(null);
                setCurrentAnalysis(null);
              }}
              onSaveToKnowledge={async () => {
                try {
                  await fetch('/api/youtube/knowledge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentAnalysis),
                  });
                  console.log('✅ Saved to knowledge base');
                } catch (error) {
                  console.error('Failed to save:', error);
                }
              }}
            />
          </div>
        )}

        {activePanel === 'knowledge' && (
          <div className="fixed top-0 right-0 h-screen w-1/3 z-50 animate-in slide-in-from-right duration-300">
            <KnowledgeBaseSearch
              onSelectVideo={(video) => {
                // Show the video's analysis
                setCurrentAnalysis(video as any);
                setActivePanel('analysis');
              }}
            />
          </div>
        )}

        {activePanel === 'news' && dailyNews && (
          <div className="fixed top-0 right-0 h-screen w-1/3 z-50 animate-in slide-in-from-right duration-300">
            <DailyNewsDigest
              digest={dailyNews}
              onAnalyzeVideo={async (videoId) => {
                try {
                  const res = await fetch('/api/youtube/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoId }),
                  });
                  const data = await res.json();
                  setCurrentAnalysis(data.analysis);
                  setActivePanel('analysis');
                } catch (error) {
                  console.error('Failed to analyze:', error);
                }
              }}
              onWatchVideo={(videoId) => {
                setYoutubeVideoId(videoId);
              }}
            />
          </div>
        )}

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
      </div>
    </SceneProvider>
  );
}

export default App;
