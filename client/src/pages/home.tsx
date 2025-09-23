import React from "react";
import ChatInterface from "@/components/ChatInterface";

const BACKGROUND_IMAGE = "/background.jpg";

export default function Home() {
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
        {/* Left side - spacer for background visibility */}
        <div className="flex-1" />
        
        {/* Right side - Chat Interface */}
        <div className="w-96 h-full flex items-center justify-center p-4">
          <div 
            className="w-full h-full max-h-[calc(100vh-2rem)]"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <ChatInterface theme="dark" />
          </div>
        </div>
      </div>
    </div>
  );
}