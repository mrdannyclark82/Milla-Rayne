import ChatInterface from "@/components/ChatInterface";

import CalendarTaskManager from "@/components/CalendarTaskManager";
import AvatarSidebar, { AvatarState } from "@/components/AvatarSidebar";
import InteractiveAvatar, { GestureType } from "@/components/InteractiveAvatar";
import { DynamicAvatar } from "@/components/DynamicAvatar";
import LivingAvatar from "@/components/LivingAvatar";
import Avatar3D from "@/components/Avatar3D";
import VideoAnalyzer from "@/components/VideoAnalyzer";
import millaRealistic from "@assets/generated_images/Hyper-realistic_Milla_full_body_dbd5d6ca.png";
import millaThoughtful from "@assets/generated_images/Milla_thoughtful_expression_avatar_dbb1829b.png";
import millaSmiling from "@assets/generated_images/Milla_smiling_expression_avatar_4945ceea.png";
import avatarVideo from "@assets/generated_images/AI_assistant_avatar_video_8218245c.png";
import millaPortraitVideo from "@assets/Creating_a_Living_Portrait_Animation_1756641116784.mp4";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsPanel from "@/components/SettingsPanel";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface VideoAnalysisResult {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export default function Home() {
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [isGamingOpen, setIsGamingOpen] = useState(false);
  const [isGardenOpen, setIsGardenOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [videoAnalysisResults, setVideoAnalysisResults] = useState<VideoAnalysisResult[]>([]);
  const [avatarState, setAvatarState] = useState<AvatarState>('neutral');
  
  // Voice settings state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.1);
  const [voiceVolume, setVoiceVolume] = useState(0.8);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const handleVideoAnalysisUpdate = (results: VideoAnalysisResult[]) => {
    setVideoAnalysisResults(results);
    // You could also send these results to the chat here if needed
  };

  const handleAvatarStateChange = (state: AvatarState) => {
    setAvatarState(state);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left side - Image area */}
      <div className="flex-shrink-0 w-[600px] h-full flex items-center justify-center bg-black/10">
        <img
          src="/unnamed.jpg"
          alt="AI companion"
          className="h-full w-auto object-cover rounded-none"
        />
      </div>

      {/* Right side - Integrated Chat Interface */}
      <div className="flex-1 h-full flex flex-col bg-black/30 backdrop-blur-md border-l border-white/10">
        <ChatInterface
          videoAnalysisResults={videoAnalysisResults}
          onAvatarStateChange={handleAvatarStateChange}
          voiceEnabled={voiceEnabled}
          speechRate={speechRate}
          voicePitch={voicePitch}
          voiceVolume={voiceVolume}
          selectedVoice={selectedVoice}
        />
      </div>

      {/* Right Side - Chat and Calendar Container */}
      <div 
        className="w-96 flex flex-col transition-all duration-300 relative"
        style={{
          backgroundColor: theme === 'light' 
            ? `rgba(255, 255, 255, ${(100 - chatTransparency) / 100})` 
            : `rgba(0, 0, 0, ${(100 - chatTransparency) / 100})`,
          backdropFilter: `blur(${backgroundBlur / 4}px)`,
          border: chatTransparency < 50 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
        }}
      >
        <Tabs defaultValue="chat" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/20 border-b border-white/10">
            <TabsTrigger 
              value="chat" 
              className="text-white/70 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
            >
              <i className="fas fa-comments mr-2"></i>
              Chat
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="text-white/70 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
            >
              <i className="fas fa-calendar mr-2"></i>
              Tasks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 mt-0">
            <ChatInterface />
          </TabsContent>
          
          <TabsContent value="calendar" className="flex-1 mt-0 p-4">
            <CalendarTaskManager className="h-full" />
          </TabsContent>
        </Tabs>

      </div>

      {/* Video Viewer Modal */}
      <VideoViewer
        isOpen={isVideoViewerOpen}
        onClose={() => setIsVideoViewerOpen(false)}
        onAnalysisUpdate={handleVideoAnalysisUpdate}
      />

      {/* Real-Time Gaming Modal */}
      <RealTimeGaming
        isOpen={isGamingOpen}
        onClose={() => setIsGamingOpen(false)}
      />

      {/* Virtual Garden Modal */}
      <VirtualGarden
        isOpen={isGardenOpen}
        onClose={() => setIsGardenOpen(false)}
      />

      {/* Interactive Story Modal */}
      <InteractiveStory
        isOpen={isStoryOpen}
        onClose={() => setIsStoryOpen(false)}
      />

      {/* Calendar Modal */}
      <CalendarApp
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />

      {/* Task List Modal */}
      <TaskList
        isOpen={isTaskListOpen}
        onClose={() => setIsTaskListOpen(false)}
      />
    </div>
  );
}