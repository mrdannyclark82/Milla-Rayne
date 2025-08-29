import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PersonalityMode } from "@/lib/MillaCore";
import type { Message } from "@shared/schema";
import { AvatarState } from "@/components/Sidebar";

interface ChatInterfaceProps {
  onPersonalityModeChange: (mode: PersonalityMode) => void;
  onAvatarStateChange: (state: AvatarState) => void;
}

export default function ChatInterface({ onPersonalityModeChange, onAvatarStateChange }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Track user typing state
  const [userIsTyping, setUserIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        content: messageContent,
        role: "user",
        personalityMode: null,
        userId: null,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessage("");
      setIsTyping(false);
      onAvatarStateChange("neutral"); // Back to neutral after response
      if (data.aiMessage?.personalityMode) {
        onPersonalityModeChange(data.aiMessage.personalityMode);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: () => {
      setIsTyping(false);
      onAvatarStateChange("neutral"); // Back to neutral on error
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + "px";
    }
  }, [message]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      setIsTyping(true);
      setUserIsTyping(false); // User stopped typing, now sending
      onAvatarStateChange("responding"); // Milla is now responding
      sendMessageMutation.mutate(message.trim());
    }
  };

  // Handle user typing state changes
  const handleInputChange = (value: string) => {
    setMessage(value);
    
    if (value.length > 0 && !userIsTyping && !sendMessageMutation.isPending) {
      setUserIsTyping(true);
      onAvatarStateChange("thinking"); // Show thinking expression when user types
    } else if (value.length === 0 && userIsTyping) {
      setUserIsTyping(false);
      onAvatarStateChange("neutral"); // Back to neutral when input is cleared
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && message.trim()) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  
  const getPersonalityModeDisplay = (mode: PersonalityMode | null | undefined) => {
    const modeConfig = {
      coach: { icon: "fas fa-dumbbell", label: "Coach Mode", color: "text-blue-500 bg-blue-500/10" },
      empathetic: { icon: "fas fa-heart", label: "Empathetic Listener", color: "text-pink-500 bg-pink-500/10" },
      strategic: { icon: "fas fa-lightbulb", label: "Strategic Advisor", color: "text-green-500 bg-green-500/10" },
      creative: { icon: "fas fa-palette", label: "Creative Partner", color: "text-purple-500 bg-purple-500/10" },
      roleplay: { icon: "fas fa-theater-masks", label: "Role-Playing Mode", color: "text-indigo-500 bg-indigo-500/10" },
    };
    
    if (!mode || !modeConfig[mode]) return null;
    
    const config = modeConfig[mode];
    return (
      <div className={`${config.color} px-2 py-1 rounded-full text-xs font-medium mb-2`}>
        <i className={`${config.icon} mr-1`}></i>
        {config.label}
      </div>
    );
  };

  return (
    <main className="flex-1 flex flex-col h-full" data-testid="chat-interface">
      {/* Semi-transparent scrim for chat area */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm border-l border-white/10 m-4 rounded-2xl">
        {/* Conversation Display Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth h-full" data-testid="messages-container">
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className="message-fade-in"
              data-testid={`message-${msg.role}-${msg.id}`}
            >
              {msg.role === "assistant" ? (
                <div className="flex items-start space-x-4">
                  <div className="flex-1 bg-transparent rounded-2xl rounded-tl-sm px-4 py-3 max-w-3xl">
                    {getPersonalityModeDisplay(msg.personalityMode)}
                    <p className="text-pink-300 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <div className="mt-3 text-xs text-pink-300/70">
                      <i className="fas fa-clock mr-1"></i>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-4 justify-end">
                  <div className="flex-1 bg-transparent rounded-2xl rounded-tr-sm px-4 py-3 max-w-2xl">
                    <p className="text-blue-300 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <div className="mt-3 text-xs text-blue-300/70 text-right">
                      <i className="fas fa-clock mr-1"></i>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-user text-blue-300 text-xs"></i>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="typing-animation" data-testid="typing-indicator">
              <div className="flex items-start space-x-4">
                <Card className="bg-transparent border-none rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-pink-300/60 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-pink-300/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-pink-300/60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </Card>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="bg-transparent p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Type your message to Milla..."
                  className="w-full bg-transparent border-none rounded-2xl px-4 py-3 pr-12 text-white placeholder:text-white/60 resize-none min-h-[3rem] max-h-32 focus:outline-none focus:ring-0 focus:border-transparent transition-all"
                  value={message}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  data-testid="input-message"
                />
                
                {/* Attachment Button */}
                <Button
                  variant="ghost" 
                  size="sm"
                  className="absolute right-3 bottom-3 p-2 text-white/60 hover:text-white transition-colors"
                  data-testid="button-attachment"
                >
                  <i className="fas fa-paperclip"></i>
                </Button>
              </div>
              
              {/* Send Button */}
              <Button
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-2xl p-3 text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                data-testid="button-send"
              >
                <i className="fas fa-paper-plane text-lg"></i>
              </Button>
            </div>
            
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
