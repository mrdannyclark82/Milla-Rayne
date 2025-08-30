import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PersonalityMode, checkIdentityQuery, MILLA_IDENTITY } from "@/lib/MillaCore";
import type { Message } from "@shared/schema";
import { AvatarState } from "@/components/Sidebar";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useConversationMemory } from "@/contexts/ConversationContext";

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

  // Voice functionality
  const { transcript, isListening, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { speak, isSpeaking } = useTextToSpeech();
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Conversation memory
  const { recentExchanges, userName, addExchange, getConversationContext, getRecentMessages, extractAndSetUserName } = useConversationMemory();
  const [hasShownIntroduction, setHasShownIntroduction] = useState(false);

  // Update message when speech transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Handle action commands and identity queries
  const handleSpecialCommands = (content: string): string | null => {
    // Check for identity queries first
    const identityResponse = checkIdentityQuery(content);
    if (identityResponse) {
      return identityResponse;
    }
    
    // Check for name queries
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('what is my name') || lowerContent.includes('what\'s my name') || 
        (lowerContent.includes('my name') && lowerContent.includes('?'))) {
      console.log('Name query detected. Current userName:', userName); // Debug log
      if (userName) {
        return `Your name is ${userName}.`;
      } else {
        return "I don't recall you telling me your name yet. What would you like me to call you?";
      }
    }
    
    // Check for action commands
    if (lowerContent.includes('create') && lowerContent.includes('note') && lowerContent.includes('keep')) {
      return "Functionality to create Keep notes is planned for a future update.";
    }
    
    return null;
  };

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  // Show introduction message if no messages exist and haven't shown it yet
  useEffect(() => {
    if (messages && messages.length === 0 && !hasShownIntroduction) {
      setHasShownIntroduction(true);
      // Add introduction message to the conversation
      setTimeout(() => {
        addExchange("", MILLA_IDENTITY.introduction);
        queryClient.setQueryData(["/api/messages"], [{
          id: "intro-message",
          content: MILLA_IDENTITY.introduction,
          role: "assistant",
          personalityMode: "empathetic",
          userId: null,
          createdAt: new Date().toISOString()
        }]);
      }, 1000);
    }
  }, [messages, hasShownIntroduction, addExchange, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      onAvatarStateChange("thinking");
      
      // Check for special commands (identity queries, actions) first
      const specialResponse = handleSpecialCommands(messageContent);
      if (specialResponse) {
        return { 
          userMessage: { content: messageContent, role: "user" }, 
          aiMessage: { content: specialResponse, role: "assistant", personalityMode: "empathetic" } 
        };
      }
      
      // Extract user name if provided in this message
      extractAndSetUserName(messageContent);
      
      // Include conversation context for AI to reference (last 4 messages)
      const recentMessages = getRecentMessages();
      
      const response = await apiRequest("POST", "/api/messages", {
        content: messageContent,
        role: "user",
        personalityMode: null,
        userId: null,
        conversationHistory: recentMessages,
        userName: userName // Send current known user name
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessage("");
      setIsTyping(false);
      onAvatarStateChange("responding");
      
      // Add to conversation memory
      if (data.userMessage && data.aiMessage) {
        addExchange(data.userMessage.content, data.aiMessage.content);
      }
      
      // Speak the response if voice is enabled
      if (voiceEnabled && data.aiMessage?.content) {
        speak(data.aiMessage.content);
      }
      
      if (data.aiMessage?.personalityMode) {
        onPersonalityModeChange(data.aiMessage.personalityMode);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      
      // Brief delay to show responding state, then reset to neutral
      setTimeout(() => {
        onAvatarStateChange("neutral");
      }, 2000);
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
      {/* Conversation Display Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth" data-testid="messages-container">
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
                
                {/* Voice Input Button */}
                <Button
                  variant="ghost" 
                  size="sm"
                  className={`absolute right-10 bottom-3 p-2 transition-colors ${
                    isListening 
                      ? 'text-red-400 animate-pulse' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  onClick={isListening ? stopListening : startListening}
                  data-testid="button-voice"
                >
                  <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
                </Button>
                
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
    </main>
  );
}
