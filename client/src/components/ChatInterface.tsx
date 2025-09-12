import React, { useState, useEffect } from "react";
import { apiRequest } from "../lib/queryClient";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load existing messages on component mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await apiRequest("GET", "/api/messages");
        const existingMessages = await res.json();
        setMessages(existingMessages);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    loadMessages();
  }, []);

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = input.trim();
      setInput("");
      setIsLoading(true);

      try {
        // Send message to API
        const res = await apiRequest("POST", "/api/messages", {
          content: userMessage,
          role: "user",
          userId: null, // You can add user identification later
        });
        
        const response = await res.json();
        
        // Update messages with both user message and any AI responses
        setMessages(prev => {
          const newMessages = [...prev, response.userMessage];
          
          // Add AI response if Milla decided to respond
          if (response.aiMessage) {
            newMessages.push(response.aiMessage);
          }
          
          // Add any follow-up messages
          if (response.followUpMessages && response.followUpMessages.length > 0) {
            newMessages.push(...response.followUpMessages);
          }
          
          return newMessages;
        });
        
      } catch (error) {
        console.error("Failed to send message:", error);
        // Add error message to chat
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: "Sorry, there was an error sending your message. Please try again.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-black/10 to-black/20">
      {/* Chat Messages Area */}
      <div 
        className="flex-1 overflow-y-auto px-6 py-8 chat-scroll"
        style={{ maxHeight: "calc(100vh - 120px)" }}
      >
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="message-fade-in">
              {msg.role === "assistant" ? (
                // Milla's message - large purple bubble on right with enhanced styling
                <div className="flex justify-end mb-8">
                  <div className="max-w-[92%] min-w-[200px]">
                    <div className="text-xs text-purple-200 mb-2 text-right font-semibold tracking-wider uppercase flex items-center justify-end">
                      <span className="mr-2">✨ Milla</span>
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs">🤖</span>
                      </div>
                    </div>
                    <div 
                      className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white rounded-3xl px-8 py-6 shadow-2xl glass-chat-bubble relative transform hover:scale-[1.02] transition-all duration-300 chat-bubble-hover"
                      style={{
                        borderTopRightRadius: "12px",
                        boxShadow: "0 10px 40px rgba(147, 51, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                        border: "1px solid rgba(147, 51, 234, 0.3)"
                      }}
                    >
                      <div className="text-base leading-relaxed font-medium">
                        {msg.content}
                      </div>
                      {/* Enhanced purple glow effect */}
                      <div className="absolute -inset-2 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl blur-lg opacity-25 -z-10 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : (
                // User's message - blue bubble below, left-aligned with enhanced styling  
                <div className="flex justify-start mb-6">
                  <div className="max-w-[82%] min-w-[160px]">
                    <div className="text-xs text-blue-200 mb-2 font-semibold tracking-wider uppercase flex items-center">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md mr-2">
                        <span className="text-white text-xs">👤</span>
                      </div>
                      <span>You</span>
                    </div>
                    <div 
                      className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl px-6 py-4 shadow-xl relative transform hover:scale-[1.02] transition-all duration-300 chat-bubble-hover"
                      style={{
                        borderTopLeftRadius: "12px",
                        boxShadow: "0 8px 28px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.3)"
                      }}
                    >
                      <div className="text-sm leading-relaxed">
                        {msg.content}
                      </div>
                      {/* Enhanced blue glow effect */}
                      <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl blur opacity-20 -z-10"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-end mb-8">
              <div className="max-w-[90%] min-w-[200px]">
                <div className="text-xs text-purple-200 mb-2 text-right font-semibold tracking-wide uppercase">
                  ✨ Milla
                </div>
                <div 
                  className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white rounded-3xl px-8 py-6 shadow-2xl glass-chat-bubble relative"
                  style={{
                    borderTopRightRadius: "12px",
                    boxShadow: "0 8px 32px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(147, 51, 234, 0.2)"
                  }}
                >
                  <div className="text-base leading-relaxed font-medium flex items-center">
                    <div className="flex space-x-2 mr-3">
                      <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                    Thinking...
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl blur opacity-20 -z-10"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/20 p-6 bg-gradient-to-r from-black/30 to-black/25 backdrop-blur-sm">
        <div className="flex space-x-4">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400/50 transition-all duration-200 text-base backdrop-blur-sm"
            placeholder="Share your thoughts with Milla..."
            onKeyDown={e => { if (e.key === "Enter" && !isLoading) handleSend(); }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 transform ${
              isLoading || !input.trim() 
                ? "bg-gray-600/50 text-gray-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105 shadow-lg"
            }`}
            style={{
              boxShadow: !isLoading && input.trim() ? "0 4px 16px rgba(59, 130, 246, 0.3)" : undefined
            }}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-paper-plane text-lg"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}