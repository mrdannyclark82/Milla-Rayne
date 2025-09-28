import React, { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import EnhancementSuggestions from "@/components/EnhancementSuggestions";

const BACKGROUND_IMAGE = "/background.jpg";

export default function Home() {
  const [avatarState, setAvatarState] = useState<'neutral' | 'thinking' | 'responding'>('neutral');

  return (
    <div
      className="fixed inset-0 w-full h-full"
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      
      {/* Main layout container */}
      <div className="relative z-10 flex h-screen">
        {/* Left side - 2D Avatar and Enhancement Suggestions - Now takes more space to show background */}
        <div className="flex-1 flex flex-col items-start justify-center space-y-6 p-8 max-w-2xl">
          {/* Temporarily disabled avatar to fix Three.js compatibility issues */}
          <div className="w-80 h-60 bg-gray-800/60 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
            <p className="text-white text-xl">Milla's Portrait</p>
          </div>
          
          {/* Enhancement Suggestions */}
          <div className="w-full max-w-lg">
            <EnhancementSuggestions />
          </div>
        </div>
        
        {/* Right side - Chat Interface - Now narrower and positioned to preserve background visibility */}
        <div className="w-80 h-full flex items-center justify-end p-6">
          <div 
            className="w-full h-full max-h-[calc(100vh-3rem)] max-w-sm"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <ChatInterface theme="dark" onAvatarStateChange={setAvatarState} />
          </div>
        </div>
      </div>
    </div>
  );
}