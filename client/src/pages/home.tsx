import ChatInterface from "@/components/ChatInterface";
import React from "react";

export default function Home() {
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
      <ChatInterface />
      
      {/* Floating Apps button - bottom left */}
      <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 z-20">
        <button
          className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow border border-white/10 text-sm sm:text-base"
          style={{ opacity: 0.7 }}
        >
          🟦 Apps
        </button>
      </div>
    </div>
  );
}