import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { checkIdentityQuery, MILLA_IDENTITY } from "@/lib/MillaCore";
import type { Message } from "@shared/schema";
import { AvatarState } from "@/components/Sidebar";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useConversationMemory } from "@/contexts/ConversationContext";
import { formatTimeCST } from "@/lib/timeUtils";
import VideoAnalyzer from "@/components/VideoAnalyzer";

// Component to handle image loading with fallback for failed loads
interface ImageWithFallbackProps {
  imageUrl: string;
  altText: string;
}

const ImageWithFallback = ({ imageUrl, altText }: ImageWithFallbackProps) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    // Reset state when URL changes
    setImageFailed(false);
  }, [imageUrl]);

  if (imageFailed) {
    // Don't render anything if the image failed to load
    return null;
  }

  return (
    <div className="my-3">
      <img 
        src={imageUrl}
        alt={altText}
        className="max-w-full h-auto rounded-lg shadow-lg border border-pink-300/20"
        style={{ maxHeight: '400px', objectFit: 'contain' }}
        onLoad={() => {
          console.log('✅ Image loaded:', imageUrl);
        }}
        onError={() => {
          console.error('❌ Image failed to load:', imageUrl);
          setImageFailed(true);
        }}
      />
    </div>
  );
};

interface ChatInterfaceProps {
  onAvatarStateChange: (state: AvatarState) => void;
  onSpeakingStateChange?: (isSpeaking: boolean) => void;
  voiceEnabled?: boolean;
  speechRate?: number;
  voicePitch?: number;
  voiceVolume?: number;
  selectedVoice?: SpeechSynthesisVoice | null;
  theme?: 'light' | 'dark';
  chatTransparency?: number;
  personalitySettings?: {
    communicationStyle: 'adaptive' | 'formal' | 'casual' | 'friendly';
    formalityLevel: 'formal' | 'balanced' | 'casual';
    responseLength: 'short' | 'medium' | 'long';
    emotionalIntelligence: 'low' | 'medium' | 'high';
  };
}

export default function ChatInterface({ 
  onAvatarStateChange, 
  onSpeakingStateChange,
  voiceEnabled = false, 
  speechRate = 1.0,
  voicePitch = 1.1,
  voiceVolume = 0.8,
  selectedVoice = null,
  theme = 'dark',
  chatTransparency = 80,
  personalitySettings
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [showVideoAnalyzer, setShowVideoAnalyzer] = useState(false);
  
  // Track user typing state
  const [userIsTyping, setUserIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Voice functionality
  const { transcript, isListening, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { 
    speak, 
    speaking: isSpeaking, 
    cancel: stopSpeaking, 
    voice,
    setVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume
  } = useSpeechSynthesis();
  
  // Sync voice settings from props
  useEffect(() => {
    if (selectedVoice && voice !== selectedVoice) {
      setVoice(selectedVoice);
    }
    if (rate !== speechRate) {
      setRate(speechRate);
    }
    if (pitch !== voicePitch) {
      setPitch(voicePitch);
    }
    if (volume !== voiceVolume) {
      setVolume(voiceVolume);
    }
  }, [selectedVoice, speechRate, voicePitch, voiceVolume, setVoice, setRate, setPitch, setVolume, voice, rate, pitch, volume]);

  // Function to render message content with image support
  const renderMessageContent = (content: string) => {
    // Handle null/undefined content
    if (!content) return content;
    
    // Simple approach: detect image markdown and replace with img tags
    const imageMarkdownPattern = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    
    // Check if content contains image markdown
    if (!imageMarkdownPattern.test(content)) {
      return content;
    }
    
    // Reset regex lastIndex for reuse
    imageMarkdownPattern.lastIndex = 0;
    
    // Split content and replace images
    const parts = content.split(imageMarkdownPattern);
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // Text content
        if (parts[i]) {
          elements.push(<span key={i}>{parts[i]}</span>);
        }
      } else if (i % 3 === 1) {
        // Alt text (skip this part)
        continue;
      } else if (i % 3 === 2) {
        // Image URL
        const altText = parts[i - 1] || "Generated Image";
        const imageUrl = parts[i];
        elements.push(
          <ImageWithFallback 
            key={i}
            imageUrl={imageUrl}
            altText={altText}
          />
        );
      }
    }
    
    return <div className="whitespace-pre-wrap">{elements}</div>;
  };
  
  // Camera functionality
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>("neutral");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set speech rate when prop changes
  useEffect(() => {
    setRate(speechRate);
  }, [speechRate, setRate]);

  // Camera functions
  const startCamera = async () => {
    try {
      console.log("Requesting camera access...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode },
        audio: false 
      });
      
      console.log("Camera stream obtained:", stream);
      console.log("Video tracks:", stream.getVideoTracks());
      
      setCameraStream(stream);
      setIsCameraActive(true);
      
       // Wait a moment for state to update, then set the video source
      setTimeout(() => {
        if (videoRef.current && stream) {
          console.log("Setting video source...");
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded, attempting to play...");
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log("Video playing successfully");
                  startRealTimeAnalysis();
                })
                .catch(e => console.error("Video play failed:", e));
            }
          };
        } 
      }, 100);
      
      toast({
        title: "Enhanced Camera Active",
        description: "Milla can now see you in real-time and detect your emotions",
      });
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Error", 
        description: `Failed to access camera: ${(error as Error).message}. Please allow camera permissions.`,
        variant: "destructive",
      });
    }
  };

  const switchCamera = async () => {
    if (!isCameraActive) return;
    
    // Stop current stream
    stopCamera();
    
    // Switch facing mode
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    // Wait a moment then restart with new facing mode
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  const startRealTimeAnalysis = () => {
    if (analysisIntervalRef.current) return; // Already running
    
    setIsAnalyzingVideo(true);
    console.log("Starting real-time video analysis...");
    
//    // Analyze video frames every 3 seconds
    analysisIntervalRef.current = setInterval(() => {
      if (videoRef.current && isCameraActive) {
        analyzeCurrentFrame();
      }
    }, 3000);
  };

  const stopRealTimeAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    setIsAnalyzingVideo(false);
    setCurrentEmotion("neutral");
  };

  const analyzeCurrentFrame = async () => {
    if (!videoRef.current) return;
    
    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.6);
        
        // Send for emotion analysis
        const response = await fetch('/api/analyze-emotion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData, timestamp: Date.now() })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.emotion) {
            setCurrentEmotion(result.emotion);
            console.log("Detected emotion:", result.emotion);
          }
        }
      }
    } catch (error) {
      console.log("Frame analysis error:", error);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
      stopRealTimeAnalysis();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      toast({
        title: "Camera Stopped",
        description: "Camera access has been disabled",
      });
    }
  };

  const sendMessageWithImage = async (messageContent: string, imageData: string) => {
    onAvatarStateChange("thinking");
    
    // Extract user name if provided in this message
    extractAndSetUserName(messageContent);
    
    // Include conversation context for AI to reference (last 4 messages)
    const recentMessages = getRecentMessages();
    
    const response = await apiRequest("POST", "/api/messages", {
      content: messageContent,
      role: "user",
      userId: null,
      conversationHistory: recentMessages,
      userName: userName,
      imageData: imageData // Include base64 image data
    });
    
    const data = await response.json();
    
    // Handle success
    setMessage("");
    setIsTyping(false);
    onAvatarStateChange("responding");
    
    // Add to conversation memory
    if (data.userMessage && data.aiMessage) {
      addExchange(data.userMessage.content, data.aiMessage.content);
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    }
    
    // Speak the response if voice is enabled
    if (voiceEnabled && data.aiMessage?.content) {
      speak(data.aiMessage.content);
    }
    
    // Brief delay to show responding state, then reset to neutral
    setTimeout(() => {
      onAvatarStateChange("neutral");
    }, 2000);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !isCameraActive) return;
    
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Send photo to Milla for analysis
      const photoMessage = "I'm sharing a photo from my camera with you.";
      try {
        await sendMessageWithImage(photoMessage, imageData);
        toast({
          title: "Photo Sent",
          description: "Milla is analyzing your photo",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send photo to Milla",
          variant: "destructive",
        });
      }
    }
  };

  // Conversation memory
  const { getRecentMessages, userName, addExchange, extractAndSetUserName } = useConversationMemory();
  const [hasShownIntroduction, setHasShownIntroduction] = useState(false);

  // Update message when speech transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Voice interruption - stop Milla speaking when user starts typing or talking
  useEffect(() => {
    if (isListening && isSpeaking) {
      console.log("User started speaking - interrupting Milla's speech");
      stopSpeaking();
      onAvatarStateChange("neutral");
    }
  }, [isListening, isSpeaking, stopSpeaking, onAvatarStateChange]);

  // Update avatar speaking state when voice synthesis state changes
  useEffect(() => {
    onSpeakingStateChange?.(isSpeaking);
  }, [isSpeaking, onSpeakingStateChange]);

  // Proactive engagement and break reminders check - DISABLED for performance
  // useEffect(() => {
  //   const checkProactiveEngagement = async () => {
  //     try {
  //       const response = await fetch('/api/proactive-message');
  //       if (response.ok) {
  //         const data = await response.json();
  //         
  //         // Handle break reminders with highest priority
  //         if (data.breakReminder) {
  //           // Show break reminder as a toast notification
  //           toast({
  //             title: "💜 Break Time Reminder",
  //             description: data.breakReminder,
  //             duration: 10000, // Show for 10 seconds
  //           });
  //           
  //           // Also add to conversation as a system message
  //           const breakMessage = {
  //             id: `break-reminder-${Date.now()}`,
  //             content: data.breakReminder,
  //             role: "assistant" as const,
  //             personalityMode: null,
  //             userId: null,
  //             timestamp: new Date()
  //           };
  //           
  //           // Add to conversation memory and update query cache
  //           addExchange("", data.breakReminder);
  //           const currentMessages = queryClient.getQueryData(["/api/messages"]) as Message[] || [];
  //           queryClient.setQueryData(["/api/messages"], [...currentMessages, breakMessage]);
  //           
  //           console.log("Break reminder shown:", data.breakReminder);
  //         }
  //         
  //         // Handle post-break welcome messages (high priority)
  //         else if (data.postBreakReachout) {
  //           // Show as toast notification
  //           toast({
  //             title: "💕 Welcome Back!",
  //             description: data.postBreakReachout,
  //             duration: 8000, // Show for 8 seconds
  //           });
  //           
  //           // Also add to conversation as a system message
  //           const welcomeMessage = {
  //             id: `welcome-back-${Date.now()}`,
  //             content: data.postBreakReachout,
  //             role: "assistant" as const,
  //             personalityMode: null,
  //             userId: null,
  //             timestamp: new Date()
  //           };
  //           
  //           // Add to conversation memory and update query cache
  //           addExchange("", data.postBreakReachout);
  //           const currentMessages = queryClient.getQueryData(["/api/messages"]) as Message[] || [];
  //           queryClient.setQueryData(["/api/messages"], [...currentMessages, welcomeMessage]);
  //           
  //           console.log("Post-break reachout shown:", data.postBreakReachout);
  //         }
  //         
  //         // Handle regular proactive messages (lower priority)
  //         else if (data.message) {
  //           console.log("Proactive message available:", data.message);
  //         }
  //       }
  //     } catch (error) {
  //       console.log("Proactive engagement check failed:", error);
  //     }
  //   };

  //   // Check for proactive messages and break reminders every 15 minutes (reduced for performance)
  //   const interval = setInterval(checkProactiveEngagement, 15 * 60 * 1000);
    
  //   // Also check immediately on component mount
  //   setTimeout(checkProactiveEngagement, 2000);
    
  //   return () => clearInterval(interval);
  // }, [toast, addExchange, queryClient]);

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
        addExchange("", MILLA_IDENTITY._introduction);
        queryClient.setQueryData(["/api/messages"], [{
          id: "intro-message",
          content: MILLA_IDENTITY._introduction,
          role: "assistant",
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
      
      // Show thinking process for complex messages
      if (messageContent.length > 20 || messageContent.includes('?')) {
        setShowThinking(true);
        setThinkingSteps([]);
        
        // Simulate thinking steps
        // Reasoning steps will come from the server response
      }
      
      // Check for special commands (identity queries, actions) first
      const specialResponse = handleSpecialCommands(messageContent);
      if (specialResponse) {
        return { 
          userMessage: { content: messageContent, role: "user" }, 
          aiMessage: { content: specialResponse, role: "assistant" },
          isSpecialCommand: true
        };
      }
      
      // Extract user name if provided in this message
      extractAndSetUserName(messageContent);
      
      // Include conversation context for AI to reference (last 4 messages)
      const recentMessages = getRecentMessages();
      
      const response = await apiRequest("POST", "/api/messages", {
        content: messageContent,
        role: "user",
        userId: null,
        conversationHistory: recentMessages,
        userName: userName // Send current known user name
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessage("");
      setIsTyping(false);
      
      // Display actual reasoning steps from server if available
      if (data.reasoning && data.reasoning.length > 0) {
        setThinkingSteps(data.reasoning);
        // Keep thinking display active for a moment before showing response
        setTimeout(() => {
          setShowThinking(false);
          setThinkingSteps([]);
        }, 2000);
      } else {
        setShowThinking(false);
        setThinkingSteps([]);
      }
      
      // Check if Milla chose to respond
      if (data.aiMessage) {
        // Milla decided to respond
        onAvatarStateChange("responding");
        
        // Add to conversation memory
        addExchange(data.userMessage.content, data.aiMessage.content);
        
        // For special commands (local responses), manually add to message cache
        if (data.isSpecialCommand) {
          const newMessages = [...(queryClient.getQueryData(["/api/messages"]) as Message[] || [])];
          
          // Add user message
          const userMessage = {
            id: `user-${Date.now()}`,
            content: data.userMessage.content,
            role: "user" as const,
            personalityMode: null,
            userId: null,
            timestamp: new Date()
          };
          
          // Add assistant message
          const assistantMessage = {
            id: `assistant-${Date.now()}`,
            content: data.aiMessage.content,
            role: "assistant" as const,
            personalityMode: null,
            userId: null,
            timestamp: new Date()
          };
          
          newMessages.push(userMessage, assistantMessage);
          queryClient.setQueryData(["/api/messages"], newMessages);
        } else {
          // For API responses, invalidate to refetch
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        }
        
        // Speak the response if voice is enabled
        if (voiceEnabled) {
          speak(data.aiMessage.content);
        }
        
        // Handle follow-up messages if Milla wants to elaborate
        if (data.followUpMessages && data.followUpMessages.length > 0) {
          console.log(`Milla has ${data.followUpMessages.length} follow-up messages to send`);
          
          // Send follow-up messages with natural delays
          data.followUpMessages.forEach((followUpMsg: any, index: number) => {
            setTimeout(() => {
              // Add follow-up to conversation memory
              addExchange("", followUpMsg.content);
              
              // Refresh messages to show the new follow-up
              queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
              
              // Speak follow-up if voice is enabled
              if (voiceEnabled) {
                speak(followUpMsg.content);
              }
              
              // Keep responding state active during follow-ups
              onAvatarStateChange("responding");
            }, (index + 1) * 2000); // 2-second delays between follow-ups
          });
          
          // Reset to neutral after all follow-ups are sent
          setTimeout(() => {
            onAvatarStateChange("neutral");
          }, (data.followUpMessages.length + 1) * 2000);
        } else {
          // No follow-ups, just brief delay then reset to neutral
          setTimeout(() => {
            onAvatarStateChange("neutral");
          }, 2000);
        }
      } else {
        // Milla chose to stay quiet - just refresh messages and go back to neutral
        console.log("Milla chose not to respond to this message");
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        onAvatarStateChange("neutral");
      }
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
  }, [messages, isTyping, showThinking, thinkingSteps]);

  // Rapid fire mode for sending multiple messages quickly
  const rapidFireSend = async (messageContent: string) => {
    if (!messageContent.trim()) return;
    
    try {
      const recentMessages = getRecentMessages();
      await apiRequest("POST", "/api/messages", {
        content: messageContent.trim(),
        role: "user",
        userId: null,
        conversationHistory: recentMessages,
        userName: userName
      });
      
      // Invalidate messages to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    } catch (error) {
      console.error("Rapid fire send error:", error);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Check if this looks like an action message (starts and ends with *)
      const isActionMessage = message.trim().startsWith('*') && message.trim().endsWith('*');
      
      if (isActionMessage) {
        // Use rapid fire for action messages
        rapidFireSend(message.trim());
        setMessage(""); // Clear the input immediately
      } else {
        // Use normal mutation for regular messages
        setIsTyping(true);
        setUserIsTyping(false);
        onAvatarStateChange("responding");
        sendMessageMutation.mutate(message.trim());
      }
    }
  };

  // Handle user typing state changes
  const handleInputChange = (value: string) => {
    setMessage(value);
    
    // Voice interruption - stop Milla speaking when user starts typing
    if (value.length > 0 && isSpeaking) {
      console.log("User started typing - interrupting Milla's speech");
      stopSpeaking();
    }
    
    if (value.length > 0 && !userIsTyping && !sendMessageMutation.isPending) {
      setUserIsTyping(true);
      // onAvatarStateChange("thinking"); // DISABLED for performance - no visual changes during typing
    } else if (value.length === 0 && userIsTyping) {
      setUserIsTyping(false);
      // onAvatarStateChange("neutral"); // DISABLED for performance - no visual changes during typing
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && message.trim()) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = message.substring(0, start) + "\n" + message.substring(end);
      setMessage(newValue);
      
      // Set cursor position after the inserted newline
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
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
                <div className="flex items-start space-x-4 justify-end">
                  <div className="flex-1 bg-transparent rounded-2xl rounded-tr-sm px-4 py-3 max-w-2xl">
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
          ))
        )}

          {/* Typing Indicator */}
          {showThinking && (
            <div className="thinking-animation" data-testid="thinking-indicator">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <i className="fas fa-brain text-pink-300 text-sm animate-pulse"></i>
                </div>
                <Card className="bg-pink-500/5 border border-pink-300/20 rounded-xl px-4 py-3 max-w-3xl">
                  <div className="text-sm text-pink-300/80 mb-2">
                    <i className="fas fa-lightbulb mr-2"></i>
                    <span className="font-medium">Thinking...</span>
                  </div>
                  <div className="space-y-2">
                    {thinkingSteps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm text-pink-300/70">
                        <div className="w-1.5 h-1.5 bg-pink-300/50 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                    <div className="flex space-x-1 mt-3">
                      <div className="w-1.5 h-1.5 bg-pink-300/60 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-pink-300/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1.5 h-1.5 bg-pink-300/60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
          
          {isTyping && !showThinking && (
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

        {/* Camera Preview */}
        {isCameraActive && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-80 h-60 bg-gray-900 border-2 border-green-400 rounded-lg overflow-hidden backdrop-blur-sm z-50 shadow-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-gray-800"
              style={{ transform: 'scaleX(-1)' }} // Mirror the video like a selfie
              onCanPlay={() => {
                console.log("Video can play");
                if (videoRef.current) {
                  videoRef.current.play().catch(e => console.error("Auto-play failed:", e));
                }
              }}
              onError={(e) => {
                console.error("Video element error:", e);
              }}
            />
            {/* Enhanced Status indicators */}
            <div className="absolute top-2 left-2 space-y-1">
              <div className="flex items-center space-x-1 bg-black/50 rounded px-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs">LIVE</span>
              </div>
              {isAnalyzingVideo && (
                <div className="flex items-center space-x-1 bg-black/50 rounded px-2 py-1">
                  <i className="fas fa-brain text-xs text-blue-400"></i>
                  <span className="text-blue-400 text-xs">AI Vision</span>
                </div>
              )}
              {currentEmotion !== "neutral" && (
                <div className="flex items-center space-x-1 bg-black/50 rounded px-2 py-1">
                  <i className="fas fa-smile text-xs text-yellow-400"></i>
                  <span className="text-yellow-400 text-xs capitalize">{currentEmotion}</span>
                </div>
              )}
            </div>
            <div className="absolute top-2 right-2 flex space-x-1">
              <Button
                variant="ghost" 
                size="sm"
                className="p-1 text-white/70 hover:text-white bg-black/50 rounded"
                onClick={switchCamera}
                data-testid="button-switch-camera"
                title="Switch camera (front/back)"
              >
                <i className="fas fa-sync text-xs"></i>
              </Button>
              <Button
                variant="ghost" 
                size="sm"
                className="p-1 text-white/70 hover:text-white bg-black/50 rounded"
                onClick={capturePhoto}
                data-testid="button-capture"
                title="Capture photo for Milla"
              >
                <i className="fas fa-camera text-xs"></i>
              </Button>
              <Button
                variant="ghost" 
                size="sm"
                className="p-1 text-red-400 hover:text-red-300 bg-black/50 rounded"
                onClick={stopCamera}
                data-testid="button-close-camera"
                title="Stop camera"
              >
                <i className="fas fa-times text-xs"></i>
              </Button>
            </div>
          </div>
        )}

        {/* Chat Input Area */}
        <div className="bg-transparent p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Type your message to Milla..."
                  className="w-full bg-transparent border-none rounded-2xl px-4 py-3 pr-44 text-white placeholder:text-white/60 resize-none min-h-[3rem] max-h-32 focus:outline-none focus:ring-0 focus:border-transparent transition-all"
                  value={message}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  data-testid="input-message"
                />
                
                {/* Camera Button */}
                <Button
                  variant="ghost" 
                  size="sm"
                  className={`absolute right-36 bottom-3 p-2 transition-colors ${
                    isCameraActive 
                      ? 'text-green-400' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  onClick={isCameraActive ? stopCamera : startCamera}
                  data-testid="button-camera"
                >
                  <i className={`fas ${isCameraActive ? 'fa-video' : 'fa-video-slash'}`}></i>
                </Button>

                {/* Voice Input Button */}
                <Button
                  variant="ghost" 
                  size="sm"
                  className={`absolute right-24 bottom-3 p-2 transition-colors ${
                    isListening 
                      ? 'text-red-400 animate-pulse' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  onClick={isListening ? stopListening : startListening}
                  data-testid="button-voice"
                >
                  <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
                </Button>
                
                {/* Video Analysis Button */}
                <Button
                  variant="ghost" 
                  size="sm"
                  className={`absolute right-10 bottom-3 p-2 transition-colors ${
                    showVideoAnalyzer 
                      ? 'text-purple-400' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  onClick={() => setShowVideoAnalyzer(!showVideoAnalyzer)}
                  data-testid="button-video-analysis"
                  title="Video Analysis"
                >
                  <i className="fas fa-video"></i>
                </Button>

                {/* Attachment Button */}
                <Button
                  variant="ghost" 
                  size="sm"
                  className="absolute right-3 bottom-3 p-2 text-white/60 hover:text-white transition-colors"
                  data-testid="button-attachment"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,video/*,audio/*,.pdf,.txt,.doc,.docx';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        toast({
                          title: "File Upload",
                          description: `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
                        });
                        // TODO: Implement file upload functionality
                      }
                    };
                    input.click();
                  }}
                >
                  <i className="fas fa-paperclip"></i>
                </Button>
              </div>
              
              {/* Send Button */}
              <Button
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-2xl p-3 text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendMessage}
                disabled={!message.trim()}
                data-testid="button-send"
              >
                <i className="fas fa-paper-plane text-lg"></i>
              </Button>
            </div>
            
          </div>
        </div>

        {/* Video Analyzer */}
        {showVideoAnalyzer && (
          <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-6">
            <div className="max-w-4xl mx-auto">
              <VideoAnalyzer 
                onAnalysisComplete={(result) => {
                  // Add video analysis to the chat
                  const analysisMessage = `🎬 **Video Analysis Complete!**\n\n**Summary:** ${result.summary}\n\n**Milla's Insights:** ${result.insights || "I found your video interesting!"}`;
                  
                  rapidFireSend(analysisMessage);
                  setShowVideoAnalyzer(false);
                  
                  toast({
                    title: "Video Analyzed",
                    description: "Milla has analyzed your video and shared her insights!",
                  });
                }}
                className="max-w-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
