import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Message } from "@shared/schema";

export default function AIAgentUI() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Aura');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch("/api/messages");
      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.userMessage) {
          setMessages(prev => [...prev, data.userMessage]);
        }
        if (data.aiMessage) {
          setMessages(prev => [...prev, data.aiMessage]);
        }
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Parent container for Columns 1 & 2 with background - w-2/3 */}
      <div 
        className="w-2/3 flex bg-fixed bg-cover bg-center"
        style={{
          backgroundImage: 'url(/background.jpg)'
        }}
      >
        {/* Column 1: Menu (Left) - w-1/2 of parent (1/3 of viewport) */}
        <div className="w-1/2 flex flex-col p-6 bg-black/40 backdrop-blur-sm">
          {/* Hamburger Menu Icon */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white text-3xl mb-8 hover:opacity-70 transition-opacity w-fit"
          >
            🍔
          </button>

          {/* Vertical Menu */}
          <nav className="flex flex-col space-y-6">
            {/* Video Analysis */}
            <div className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg cursor-pointer transition-colors">
              <span className="text-2xl">🎥</span>
              <span className="text-lg font-medium">Video Analysis</span>
            </div>

            {/* Voice Settings */}
            <div className="flex flex-col space-y-4 text-white bg-white/10 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎤</span>
                <span className="text-lg font-medium">Voice Settings</span>
              </div>

              {/* Voice Options Dropdown */}
              <div className="ml-8 space-y-2">
                <label className="text-sm text-gray-200">Voice:</label>
                <select 
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-black/50 text-white border border-white/30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="Aura">Aura</option>
                  <option value="Nimbus">Nimbus</option>
                  <option value="Echo">Echo</option>
                </select>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-200">Voice Output:</span>
                  <Switch 
                    checked={voiceEnabled}
                    onCheckedChange={setVoiceEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Placeholder for Future Updates */}
            <div className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg cursor-pointer transition-colors">
              <span className="text-2xl">⚙️</span>
              <span className="text-lg font-medium">Settings</span>
            </div>

            {/* Additional Placeholder */}
            <div className="flex items-center space-x-3 text-white hover:bg-white/10 p-3 rounded-lg cursor-pointer transition-colors">
              <span className="text-2xl">⚙️</span>
              <span className="text-lg font-medium">Future Feature</span>
            </div>
          </nav>
        </div>

        {/* Column 2: Empty (Middle) - w-1/2 of parent (1/3 of viewport) */}
        <div className="w-1/2">
          {/* Intentionally empty */}
        </div>
      </div>

      {/* Column 3: Chat Interface (Right) - w-1/3 */}
      <div className="w-1/3 bg-black flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-white text-xl font-semibold">AI Assistant</h2>
        </div>

        {/* Recent Messages Display Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div 
              key={msg.id || idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-100 rounded-lg p-3">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area (Bottom) */}
        <div className="p-4 border-t border-gray-700 space-y-3">
          {/* Text Input */}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="w-full bg-gray-800 text-white border-gray-600 focus:border-gray-500 resize-none"
            rows={3}
          />

          {/* Buttons Row */}
          <div className="flex items-center space-x-2">
            {/* Microphone Button */}
            <Button
              variant="outline"
              size="icon"
              className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
              disabled={isLoading}
            >
              🎙️
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="mr-2">✈️</span>
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
