
import React, { useState, useEffect, useRef } from "react";
import { useConversationMemory } from "@/contexts/ConversationContext";
import type { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { AvatarState } from "@/components/AvatarSidebar";

interface ChatInterfaceProps {
  theme?: 'light' | 'dark';
  onAvatarStateChange?: (state: AvatarState) => void;
}

interface MessageResponse {
  userMessage: Message;
  aiMessage: Message | null;
  followUpMessages?: Message[];
  reasoning?: string[];
}

export default function ChatInterface({ 
  theme = 'dark', 
  onAvatarStateChange 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    addExchange, 
    getRecentMessages, 
    extractAndSetUserName, 
    userName 
  } = useConversationMemory();

  // Load existing messages on component mount
  useEffect(() => {
    loadMessages();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const response = await fetch("/api/messages");
      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
      } else {
        console.error("Failed to load messages:", response.status);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Failed to load conversation history");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null);
    
    // Extract user name if provided
    extractAndSetUserName(userMessage);

    // Set avatar to thinking state
    onAvatarStateChange?.('thinking');

    try {
      const conversationHistory = getRecentMessages();
      
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: userMessage,
          role: "user",
          conversationHistory,
          userName: userName || "Danny Ray"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MessageResponse = await response.json();
      
      // Update messages with user message and AI response
      const newMessages: Message[] = [data.userMessage];
      
      if (data.aiMessage) {
        newMessages.push(data.aiMessage);

        
        // Add to conversation memory
        addExchange(data.userMessage.content, data.aiMessage.content);
        

        // Set avatar to responding state
        onAvatarStateChange?.('responding');
        
        // Reset to neutral after a delay
        setTimeout(() => {
          onAvatarStateChange?.('neutral');
        }, 3000);
      }
      
      // Add any follow-up messages
      if (data.followUpMessages?.length) {
        newMessages.push(...data.followUpMessages);
        
        // Add follow-ups to conversation memory
        data.followUpMessages.forEach(followUp => {
          addExchange("", followUp.content);
        });
      }
      
      setMessages(prev => [...prev, ...newMessages]);
      
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
      onAvatarStateChange?.('neutral');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageBubbleClass = (role: "user" | "assistant") => {
    const baseClass = "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm";
    
    if (role === "user") {
      return `${baseClass} ${theme === 'light' 
        ? 'bg-blue-500 text-white ml-auto' 
        : 'bg-blue-600 text-white ml-auto'
      }`;
    } else {
      return `${baseClass} ${theme === 'light'
        ? 'bg-gray-100 text-gray-800 mr-auto'
        : 'bg-gray-700 text-gray-100 mr-auto'
      }`;

    }
  };

  // Filter messages to show only the most recent one (requirement 1)
  const recentMessage = messages && messages.length > 0 ? [messages[messages.length - 1]] : [];

  return (

    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b ${
        theme === 'light' 
          ? 'bg-white/90 border-gray-200 text-gray-800' 
          : 'bg-black/90 border-gray-700 text-white'
      }`}>
        <h2 className="text-lg font-semibold flex items-center">
          <span className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></span>
          Chat with Milla
          {userName && (
            <span className="text-sm font-normal ml-2 opacity-70">
              (Hi, {userName}!)
            </span>
          )}
        </h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className={`text-center py-8 ${
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <div className="text-2xl mb-2">💬</div>
            <p className="text-sm">Start a conversation with Milla!</p>
            <p className="text-xs mt-1 opacity-70">She has access to your shared memories and experiences.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className="flex">
            <div className={getMessageBubbleClass(message.role)}>
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
              <div className={`text-xs mt-1 opacity-60 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}>
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex">
            <div className={getMessageBubbleClass("assistant")}>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>


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
                className="resize-none bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl backdrop-blur-sm focus:border-pink-400/50 focus:ring-pink-400/25 min-h-[40px] max-h-32 transition-all duration-200"
                rows={1}
                disabled={isLoading}
                style={{
                  height: 'auto',
                  minHeight: '40px',
                  maxHeight: '128px'
                }}
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

      </div>
    </main>
  );
}
