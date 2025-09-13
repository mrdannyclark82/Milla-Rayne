import ChatInterface from "@/components/ChatInterface";
import React from "react";

export default function Home() {
  return (
    <div className="h-screen w-screen bg-white relative overflow-hidden">
      {/* Image container - fixed size, right side */}
      <div className="absolute top-8 right-8 w-[340px] h-[420px] rounded-2xl overflow-hidden shadow-xl z-0">
        <img
          src="/unnamed.jpg"
          alt="AI companion"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Chat Interface - right panel */}
      <div className="absolute top-8 right-[380px] w-[400px] h-[80vh] flex items-center justify-end z-10">
        <ChatInterface />
      </div>
      {/* Floating Apps button - bottom left */}
      <div className="absolute bottom-8 left-8 z-20">
        <button
          className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow border border-white/10"
          style={{ opacity: 0.7 }}
        >
          🟦 Apps
        </button>
      </div>
    </div>
  );
}