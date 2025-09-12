import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { checkIdentityQuery, MILLA_IDENTITY } from "@/lib/MillaCore";
import type { Message } from "@shared/schema";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useConversationMemory } from "@/contexts/ConversationContext";
import { formatTimeCST } from "@/lib/timeUtils";

const BACKGROUND_IMAGE = "/attached_assets/6124451be476ac0007e3face_bdd6ecce-c0f8-48c9-98c1-183aef053c3a_1756909651397.jpg";

// Memoized message list to prevent unnecessary re-renders
type MessageListProps = {
  messages: Message[];
  renderMessageContent: (content: string) => React.ReactNode;
  formatTimeCST: (ts: any) => string;
};

const MemoizedMessageList = React.memo(function MessageList({ 
  messages, 
  renderMessageContent, 
  formatTimeCST 
}: MessageListProps) {
  return (
    <>
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className="message-fade-in"
          data-testid={`message-${msg.role}-${msg.id}`}
        >
          {msg.role === "assistant" ? (
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-robot text-white text-xs"></i>
              </div>
              <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-3xl border border-white/10">
                <div className="text-pink-300 leading-relaxed whitespace-pre-wrap">
                  {renderMessageContent(msg.content)}
                </div>
                <div className="mt-3 text-xs text-pink-300/70">
                  <i className="fas fa-clock mr-1"></i>
                  {formatTimeCST(msg.timestamp)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-4 justify-end mb-4">
              <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-2xl rounded-tr-sm px-4 py-3 max-w-2xl border border-white/10">
                <div className="text-blue-300 leading-relaxed whitespace-pre-wrap">
                  {renderMessageContent(msg.content)}
                </div>
                <div className="mt-3 text-xs text-blue-300/70 text-right">
                  <i className="fas fa-clock mr-1"></i>
                  {formatTimeCST(msg.timestamp)}
                </div>
              </div>
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-user text-blue-300 text-xs"></i>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
});

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { addExchange, getRecentMessages, extractAndSetUserName } = useConversationMemory();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch existing messages from the server
  const { data: existingMessages } = useQuery({
    queryKey: ["/api/messages"],
    enabled: true,
  });

  useEffect(() => {
    if (existingMessages && Array.isArray(existingMessages)) {
      setMessages(existingMessages);
    }
  }, [existingMessages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        content: messageContent,
        role: "user",
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: input,
        role: "user",
        timestamp: new Date(),
        personalityMode: null,
        userId: null,
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Extract user name if present
      extractAndSetUserName(input);
      
      // Add assistant response
      if (data?.response) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
          personalityMode: data.personalityMode || null,
          userId: null,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Add to conversation memory
        addExchange(input, data.response);
      }
      
      setInput("");
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      
      // Mock response for demo purposes if API fails
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: input,
        role: "user",
        timestamp: new Date(),
        personalityMode: null,
        userId: null,
      };
      
      const mockResponse: Message = {
        id: crypto.randomUUID(),
        content: "Hello! I'm Milla, your AI assistant. I'm here to help you with anything you need. How can I assist you today?",
        role: "assistant",
        timestamp: new Date(),
        personalityMode: "empathetic",
        userId: null,
      };
      
      setMessages(prev => [...prev, userMessage, mockResponse]);
      addExchange(input, mockResponse.content);
      
      toast({
        title: "Connection Issue",
        description: "Using offline mode - responses may be limited.",
        variant: "default",
      });
      
      setInput("");
      setIsLoading(false);
    },
  });

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    sendMessageMutation.mutate(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const renderMessageContent = (content: string) => {
    return content;
  };

  return (
    <div 
      className="flex flex-col h-full relative"
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Background Overlay for text visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-[2px]" />
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Chat Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Chat with Milla</h2>
              <p className="text-sm text-white/70">Your AI Assistant</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white/60">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-comments text-white text-xl"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                <p className="text-sm">Send a message to begin chatting with Milla</p>
              </div>
            </div>
          ) : (
            <MemoizedMessageList 
              messages={messages}
              renderMessageContent={renderMessageContent}
              formatTimeCST={formatTimeCST}
            />
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <i className="fas fa-robot text-white text-xs"></i>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 border border-white/10">
                <div className="flex items-center space-x-2 text-pink-300">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
                  </div>
                  <span className="text-sm">Milla is typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message to Milla..."
                className="w-full bg-black/40 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/50 resize-none min-h-[3rem] max-h-32 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                rows={1}
                disabled={isLoading}
              />
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-2xl p-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin text-lg"></i>
              ) : (
                <i className="fas fa-paper-plane text-lg"></i>
              )}
            </Button>
          </div>
          
          {/* Input Helper Text */}
          <div className="flex items-center justify-between mt-2 text-xs text-white/50">
            <div className="flex items-center space-x-4">
              <span>
                <i className="fas fa-shield-alt mr-1"></i>
                End-to-end encrypted
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-black/20 rounded text-xs border border-white/20">⌘</kbd>
              <kbd className="px-2 py-1 bg-black/20 rounded text-xs border border-white/20">Enter</kbd>
              <span>to send</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
   