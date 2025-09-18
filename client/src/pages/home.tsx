import ChatInterface from "@/components/ChatInterface";
import VideoViewer from "@/components/VideoViewer";
import CalendarApp from "@/components/CalendarApp";
import TaskList from "@/components/TaskList";
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
  const [videoAnalysisResults, setVideoAnalysisResults] = useState<VideoAnalysisResult[]>([]);
  const [avatarState, setAvatarState] = useState<AvatarState>('neutral');

  const handleVideoAnalysisUpdate = (results: VideoAnalysisResult[]) => {
    setVideoAnalysisResults(results);
    // You could also send these results to the chat here if needed
  };

  const handleAvatarStateChange = (state: AvatarState) => {
    setAvatarState(state);
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Full screen background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/unnamed.jpg"
          alt="AI companion background"
          className="w-full h-full object-cover"
        />
        {/* Overlay to ensure readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      {/* Main UI Layout - Split screen with background on left and chat on right */}
      <div className="relative z-10 h-full flex">
        {/* Left side - Background image area (for avatar/visual elements) */}
        <div className="flex-1 flex items-center justify-center">
          {/* This area is available for future avatar display or other UI elements */}
        </div>
        
        {/* Right side - Integrated Chat Interface */}
        <div className="w-96 max-w-[40vw] min-w-[320px] bg-black/30 backdrop-blur-md border-l border-white/10">
          <ChatInterface 
            videoAnalysisResults={videoAnalysisResults} 
            onAvatarStateChange={handleAvatarStateChange}
          />
        </div>
      </div>
      
      {/* Floating Apps menu - positioned over the left side */}
      <div className={`absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-20 transition-all duration-300 ${
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