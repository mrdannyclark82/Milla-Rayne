import ChatInterface from "@/components/ChatInterface";
import VideoViewer from "@/components/VideoViewer";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface VideoAnalysisResult {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export default function Home() {
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  const [videoAnalysisResults, setVideoAnalysisResults] = useState<VideoAnalysisResult[]>([]);

  const handleVideoAnalysisUpdate = (results: VideoAnalysisResult[]) => {
    setVideoAnalysisResults(results);
    // You could also send these results to the chat here if needed
  };

  return (
    <div className="h-screen w-screen bg-white relative overflow-hidden">
      {/* Image container - responsive positioning */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-[280px] h-[350px] sm:w-[340px] sm:h-[420px] rounded-2xl overflow-hidden shadow-xl z-0">
        <img
          src="/unnamed.jpg"
          alt="AI companion"
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Chat Interface - positioned by its own internal styling */}
      <ChatInterface videoAnalysisResults={videoAnalysisResults} />
      
      {/* Floating Apps menu - bottom left */}
      <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow border border-white/10 text-sm sm:text-base"
              style={{ opacity: 0.7 }}
            >
              🟦 Apps
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem 
              onClick={() => setIsVideoViewerOpen(true)}
              className="flex items-center space-x-2"
            >
              <span>🎥</span>
              <span>Video Analyzer</span>
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
    </div>
  );
}