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
import VideoAnalyzer from "@/components/VideoViewer";
// React Icons imports
import { 
  FaPaperPlane, 
  FaMicrophone, 
  FaStop, 
  FaVideo, 
  FaVideoSlash, 
  FaPaperclip, 
  FaCamera, 
  FaSync, 
  FaTimes, 
  FaClock, 
  FaBrain, 
  FaLightbulb, 
  FaShieldAlt, 
  FaSmile,
  FaRobot,
  FaUser
} from "react-icons/fa";


interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;

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
  videoAnalysisResults,
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
  const { recentExchanges, userName, addExchange, getConversationContext, getRecentMessages, extractAndSetUserName } = useConversationMemory();
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

  // Fetch messages with balanced caching to reduce API calls while preventing stale data
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter to prevent stale/duplicate messages
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: true, // Allow refetch on mount for fresh data
    refetchOnReconnect: false, // Don't refetch on reconnect
    refetchInterval: false, // No automatic refetch interval
    retry: 2, // Limit retries to reduce redundant requests
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Show introduction message if no messages exist and haven't shown it yet
  useEffect(() => {
    const messagesArray = messages as Message[];
    if (messagesArray && messagesArray.length === 0 && !hasShownIntroduction) {
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
    onError: (error) => {
      console.error("Send message mutation error:", error);
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

  // Filter messages to show only the most recent one (requirement 1)
  const recentMessage = messages && messages.length > 0 ? [messages[messages.length - 1]] : [];

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
    </main>
  );
}
