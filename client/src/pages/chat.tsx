import React from "react";
import ChatInterface from "@/components/ChatInterface";

export default function Chat() {
  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <ChatInterface theme="dark" />
    </div>
  );
}