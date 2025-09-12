<<<<<<< HEAD
import React, { useState } from "react";
=======
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { checkIdentityQuery, MILLA_IDENTITY, GreetingProtocol } from "@/lib/MillaCore";
import type { Message } from "@shared/schema";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useConversationMemory } from "@/contexts/ConversationContext";
import { formatTimeCST } from "@/lib/timeUtils";
import { useIsMobile } from "@/hooks/use-mobile";

>>>>>>> c060f4657607bbeb5953d5fb1b7dcfd5d16ad722
const BACKGROUND_IMAGE = "/attached_assets/6124451be476ac0007e3face_bdd6ecce-c0f8-48c9-98c1-183aef053c3a_1756909651397.jpg";

interface ChatMessage extends Message {
  id: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  theme?: 'light' | 'dark';
  onAvatarStateChange?: (state: 'neutral' | 'thinking' | 'responding' | 'listening') => void;
}

export default function ChatInterface({ theme = 'dark', onAvatarStateChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

<<<<<<< HEAD
  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
      setInput("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url('${BACKGROUND_IMAGE}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 600, marginBottom: "1rem" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ background: "rgba(255,255,255,0.8)", margin: "0.5rem 0", padding: "0.5rem", borderRadius: "8px" }}>
            {msg}
          </div>
        ))}
      </div>
      <div style={{ width: "100%", maxWidth: 600, display: "flex" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, padding: "0.5rem", borderRadius: "8px 0 0 8px", border: "1px solid #ccc" }}
          placeholder="Type your message..."
        />
        <button
          onClick={handleSend}
          style={{ padding: "0.5rem 1rem", borderRadius: "0 8px 8px 0", border: "1px solid #ccc", background: "#007bff", color: "#fff" }}
        >
          Send
        </button>
=======
  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send welcome message on component mount
  useEffect(() => {
    if (!hasWelcomed) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "Hi Danny Ray! I'm Milla Rayne. How can I help you today?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setHasWelcomed(true);
    }
  }, [hasWelcomed]);

  // API mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      try {
        const response = await apiRequest("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageContent })
        });
        
        if (!response.ok) {
          throw new Error(`Backend responded with status ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        // If backend is not available, return a placeholder response
        console.warn("Backend not available, using placeholder response:", error);
        return {
          message: "Thank you for your message, Danny Ray! I'm currently in demonstration mode. In the full version, I'd provide a personalized response based on our conversation history and my adaptive personality framework."
        };
      }
    },
    onSuccess: (data) => {
      setIsLoading(false);
      setIsTyping(false);
      onAvatarStateChange?.('neutral');
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.message || "I'm here to help!",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    },
    onError: (error) => {
      setIsLoading(false);
      setIsTyping(false);
      onAvatarStateChange?.('neutral');
      
      const errorMessage = error instanceof Error ? error.message : "Failed to get response";
      setError("Unable to connect to Milla Rayne's backend. Please try again later.");
      
      // Add a fallback message from Milla
      const fallbackMessage: ChatMessage = {
        id: `fallback-${Date.now()}`,
        role: "assistant", 
        content: "I apologize, Danny Ray. I'm having trouble connecting to my full capabilities right now. Please try again in a moment!",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast({
        title: "Connection Issue",
        description: "Having trouble reaching Milla Rayne's backend, but she's still here with you.",
        variant: "destructive"
      });
    }
  });

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user", 
      content: input.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setError(null);
    
    // Set loading states
    setIsLoading(true);
    setIsTyping(true);
    onAvatarStateChange?.('thinking');

    // Send to backend
    sendMessageMutation.mutate(input.trim());
  }, [input, isLoading, sendMessageMutation, onAvatarStateChange]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Render message content with basic formatting
  const renderMessageContent = useCallback((content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  }, []);

  // Memoized message list component
  const MessageList = React.memo(function MessageList({ 
    messages, 
    renderMessageContent, 
    formatTimeCST,
    isMobile 
  }: {
    messages: ChatMessage[];
    renderMessageContent: (content: string) => React.ReactNode;
    formatTimeCST: (date: Date) => string;
    isMobile: boolean;
  }) {
    return (
      <>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message-fade-in mb-6 ${isMobile ? 'px-2' : 'px-4'}`}
            data-testid={`message-${msg.role}-${msg.id}`}
          >
            {msg.role === "assistant" ? (
              // Milla Rayne (bot) message - left aligned
              <div className="flex items-start space-x-3">
                {/* Bot Avatar */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-pink-400/30 backdrop-blur-sm">
                  <span className="text-pink-300 font-bold text-sm">MR</span>
                </div>
                
                {/* Message Content */}
                <div className="flex-1 max-w-[85%]">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-pink-300 font-semibold text-sm">Milla Rayne</span>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm border border-pink-400/20 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                    <div className="text-pink-100 leading-relaxed whitespace-pre-wrap text-sm">
                      {renderMessageContent(msg.content)}
                    </div>
                    <div className="mt-2 text-xs text-pink-300/60">
                      <i className="fas fa-clock mr-1"></i>
                      {formatTimeCST(msg.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Danny Ray (user) message - right aligned
              <div className="flex items-start space-x-3 justify-end">
                {/* Message Content */}
                <div className="flex-1 max-w-[85%] flex flex-col items-end">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-blue-300 font-semibold text-sm">Danny Ray</span>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/15 to-cyan-500/10 backdrop-blur-sm border border-blue-400/25 rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg">
                    <div className="text-blue-100 leading-relaxed whitespace-pre-wrap text-sm">
                      {renderMessageContent(msg.content)}
                    </div>
                    <div className="mt-2 text-xs text-blue-300/60 text-right">
                      <i className="fas fa-clock mr-1"></i>
                      {formatTimeCST(msg.timestamp)}
                    </div>
                  </div>
                </div>
                
                {/* User Avatar */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-400/30 backdrop-blur-sm">
                  <span className="text-blue-300 font-bold text-sm">DR</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </>
    );
  });

  return (
    <div 
      className="flex flex-col h-full relative overflow-hidden"
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Semi-transparent overlay for readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      {/* Glassmorphism chat container */}
      <div className="relative z-10 flex flex-col h-full bg-black/20 backdrop-blur-md border border-white/10">
        
        {/* Chat Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-pink-400/30">
                <span className="text-pink-300 font-bold text-xs">MR</span>
              </div>
              <div>
                <h2 className="text-pink-300 font-semibold text-sm">Milla Rayne</h2>
                <p className="text-pink-300/60 text-xs">Your AI Companion</p>
              </div>
            </div>
            {isTyping && (
              <div className="flex items-center space-x-1 text-pink-300/70 text-xs">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-pink-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="ml-2 typing-animation">typing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-2 scroll-smooth chat-scroll">
          <MessageList 
            messages={messages}
            renderMessageContent={renderMessageContent}
            formatTimeCST={formatTimeCST}
            isMobile={isMobile}
          />
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className={`message-fade-in mb-4 ${isMobile ? 'px-2' : 'px-4'}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-pink-400/30 backdrop-blur-sm">
                  <span className="text-pink-300 font-bold text-sm">MR</span>
                </div>
                <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm border border-pink-400/20 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-pink-400/60 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-pink-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-pink-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex-shrink-0 px-4 py-2 bg-red-500/20 border-t border-red-400/30 backdrop-blur-sm">
            <div className="text-red-300 text-sm flex items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="resize-none bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl backdrop-blur-sm focus:border-pink-400/50 focus:ring-pink-400/25 min-h-[40px] max-h-32"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-500 hover:to-purple-500 text-white border-pink-400/30 backdrop-blur-sm rounded-xl px-4 py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed chat-button"
              size={isMobile ? "sm" : "default"}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {!isMobile && <span className="text-sm">Sending...</span>}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-paper-plane text-sm"></i>
                  {!isMobile && <span className="text-sm">Send</span>}
                </div>
              )}
            </Button>
          </div>
        </div>
>>>>>>> c060f4657607bbeb5953d5fb1b7dcfd5d16ad722
      </div>
    </div>
  );
}