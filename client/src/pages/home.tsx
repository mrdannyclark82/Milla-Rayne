import ChatInterface from "@/components/ChatInterface";
import React from "react";

const BACKGROUND_IMAGE = "/unnamed.jpg"; // Place your image in client/public/

export default function Home() {
  const handleOpenCalendar = () => {
    alert("Calendar feature coming soon!");
  };

  const handleOpenTasks = () => {
    alert("Task feature coming soon!");
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{
        backgroundImage: `url('${BACKGROUND_IMAGE}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Top Left - Action Buttons */}
      <div className="flex gap-4 p-6">
        <button
          onClick={handleOpenCalendar}
          className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-sm"
        >
          📅 Calendar
        </button>
        <button
          onClick={handleOpenTasks}
          className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 shadow-sm"
        >
          📋 Tasks
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <ChatInterface />
      </div>
    </div>
  );
}