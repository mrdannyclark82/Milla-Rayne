import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIAgentUI() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I assist you today?', sender: 'ai', timestamp: new Date() },
    { id: '2', text: 'I need help with my project', sender: 'user', timestamp: new Date() },
    { id: '3', text: 'I\'d be happy to help! What kind of project are you working on?', sender: 'ai', timestamp: new Date() },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('aura');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen">
      {/* Parent container for Columns 1 and 2 with background image */}
      <div
        className="w-2/3 bg-fixed bg-cover bg-center flex"
        style={{
          backgroundImage: 'url(/background.jpg)',
        }}
      >
        {/* Column 1: Menu (Left) - 1/2 of parent (1/3 of viewport) */}
        <div className="w-1/2 bg-black/40 backdrop-blur-sm border-r border-white/10 flex flex-col p-6">
          {/* Hamburger Menu Icon */}
          <div className="mb-8">
            <button className="text-white text-2xl hover:text-pink-400 transition-colors">
              🍔
            </button>
          </div>

          {/* Vertical Menu */}
          <nav className="flex-1 space-y-6">
            {/* Video Analysis */}
            <div className="flex items-center space-x-3 text-white hover:text-pink-400 transition-colors cursor-pointer">
              <span className="text-xl">🎥</span>
              <span className="text-lg">Video Analysis</span>
            </div>

            {/* Voice Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-white">
                <span className="text-xl">🎤</span>
                <span className="text-lg">Voice Settings</span>
              </div>

              {/* Voice Options Dropdown */}
              <div className="ml-8 space-y-3">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Select Voice:</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aura">Aura</SelectItem>
                      <SelectItem value="nimbus">Nimbus</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-white/80 text-sm">Enable Voice Output:</label>
                  <Switch
                    checked={voiceEnabled}
                    onCheckedChange={setVoiceEnabled}
                    className="data-[state=checked]:bg-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Placeholders for Future Updates */}
            <div className="flex items-center space-x-3 text-white/60 cursor-not-allowed">
              <span className="text-xl">⚙️</span>
              <span className="text-lg">Future Updates</span>
            </div>
          </nav>
        </div>

        {/* Column 2: Empty (Middle) - 1/2 of parent (1/3 of viewport) */}
        <div className="w-1/2">
          {/* Intentionally empty - shows background */}
        </div>
      </div>

      {/* Column 3: Chat Interface (Right) - 1/3 of viewport */}
      <div className="w-1/3 bg-black flex flex-col">
        {/* Recent Messages Display Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-pink-500/80 text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area (Bottom) */}
        <div className="border-t border-white/10 p-6 space-y-3">
          {/* Large Input Box */}
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder-white/50 resize-none focus:border-pink-400/50 focus:ring-pink-400/25"
          />

          {/* Buttons Row */}
          <div className="flex items-center space-x-3">
            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="flex-1 bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-500 hover:to-purple-500 text-white"
            >
              <span className="text-lg mr-2">✈️</span>
              Send
            </Button>

            {/* Microphone Button */}
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-pink-400"
            >
              <span className="text-lg">🎙️</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
