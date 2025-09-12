import React, { useState } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "milla";
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Milla, your AI assistant. How can I help you today?",
      sender: "milla",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: input,
        sender: "user",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInput("");
      
      // Simulate Milla's response after a short delay
      setTimeout(() => {
        const millaResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I understand what you're saying. Let me help you with that.",
          sender: "milla",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, millaResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Handlers for Calendar and Tasks buttons
  const handleOpenCalendar = () => {
    alert("Calendar feature coming soon!");
  };

  const handleOpenTasks = () => {
    alert("Task feature coming soon!");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Top Bar with Action Buttons */}
      <div className="flex justify-center items-center p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex gap-4">
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
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                message.sender === "user"
                  ? "bg-blue-500 text-white rounded-br-md"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === "user" ? "text-blue-100" : "text-gray-400"
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-gray-200">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}