import ChatInterface from "@/components/ChatInterface";
import VideoViewer from "@/components/VideoViewer";
import CalendarApp from "@/components/CalendarApp";
import TaskList from "@/components/TaskList";
import RealTimeGaming from "@/components/RealTimeGaming";
import VirtualGarden from "@/components/VirtualGarden";
import InteractiveStory from "@/components/InteractiveStory";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AvatarState } from "@/components/Sidebar";

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

      {/* Floating Apps menu - positioned over the left side */}
      <div className={`absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-40 transition-all duration-300 ${
        isVideoViewerOpen ? 'left-[25rem] sm:left-[26rem]' : 'left-4 sm:left-8'
      }`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-800/80 text-gray-200 rounded-lg hover:bg-gray-700/80 transition-colors duration-200 shadow border border-white/10 text-sm sm:text-base backdrop-blur-sm"
              style={{ opacity: 0.9 }}
            >
              🟦 Apps
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white/95 backdrop-blur-sm border-white/20">
            <DropdownMenuItem 
              onClick={() => setIsVideoViewerOpen(true)}
              className="flex items-center space-x-2 hover:bg-gray-100/80"
            >
              <span>🎥</span>
              <span>Video Analyzer</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsGamingOpen(true)}
              className="flex items-center space-x-2 hover:bg-gray-100/80"
            >
              <span>🎮</span>
              <span>Real-Time Gaming</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsGardenOpen(true)}
              className="flex items-center space-x-2 hover:bg-gray-100/80"
            >
              <span>🌱</span>
              <span>Virtual Garden</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsStoryOpen(true)}
              className="flex items-center space-x-2 hover:bg-gray-100/80"
            >
              <span>📖</span>
              <span>Interactive Story</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsCalendarOpen(true)}
              className="flex items-center space-x-2 hover:bg-gray-100/80"
            >
              <span>📅</span>
              <span>Calendar</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsTaskListOpen(true)}
              className="flex items-center space-x-2 hover:bg-gray-100/80"
            >
              <span>✅</span>
              <span>Task List</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="flex items-center space-x-2 hover:bg-gray-100/80"
            >
              <span>{voiceEnabled ? '🔊' : '🔇'}</span>
              <span>{voiceEnabled ? 'Disable Voice' : 'Enable Voice'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="flex items-center space-x-2">
              <span>🔧</span>
              <span>Settings (Coming Soon)</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="flex items-center space-x-2">
              <span>📊</span>
              <span>Analytics (Coming Soon)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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