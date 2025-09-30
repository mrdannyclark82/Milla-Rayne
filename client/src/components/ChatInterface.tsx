
import React, { useState, useEffect, useRef } from "react";
import { useConversationMemory } from "@/contexts/ConversationContext";
import type { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInterfaceProps {
  theme?: 'light' | 'dark';
  onAvatarStateChange?: (state: 'neutral' | 'thinking' | 'responding') => void;
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
  const [isMobile, setIsMobile] = useState(false);
  const [detectedUrlType, setDetectedUrlType] = useState<'youtube' | 'github' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
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

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Detect URLs in input
  useEffect(() => {
    const youtubeUrlPattern = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const githubUrlPattern = /github\.com\/[^\/\s]+\/[^\/\s]+/i;
    
    if (youtubeUrlPattern.test(input)) {
      setDetectedUrlType('youtube');
    } else if (githubUrlPattern.test(input)) {
      setDetectedUrlType('github');
    } else {
      setDetectedUrlType(null);
    }
  }, [input]);

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

  const handleSendMessage = async () => {
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
      // Check if message contains a YouTube URL
      const youtubeUrlPattern = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const isYouTubeAnalysisRequest = youtubeUrlPattern.test(userMessage);
      
      // Check if message contains a GitHub repository URL
      const githubUrlPattern = /github\.com\/[^\/\s]+\/[^\/\s]+/i;
      const isRepositoryAnalysisRequest = githubUrlPattern.test(userMessage);
      
      // Check if user is asking for repository improvements
      const improvementKeywords = ['improve', 'improvement', 'enhance', 'enhancement', 'suggest', 'fix', 'better'];
      const repoKeywords = ['repo', 'repository', 'code', 'this'];
      const hasRepoContext = !!(window as any).lastRepositoryUrl || 
                            messages.some(msg => msg.content.match(/github\.com\/[^\/\s]+\/[^\/\s]+/i));
      
      const isImprovementRequest = improvementKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      ) && (
        repoKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)) ||
        hasRepoContext
      );

      if (isYouTubeAnalysisRequest) {
        // Handle YouTube video analysis
        await handleYouTubeAnalysis(userMessage);
      } else if (isRepositoryAnalysisRequest) {
        // Handle repository analysis
        await handleRepositoryAnalysis(userMessage);
      } else if (isImprovementRequest && !isRepositoryAnalysisRequest) {
        // Handle repository improvement suggestions
        await handleRepositoryImprovements(userMessage);
      } else {
        // Handle normal chat message
        await handleNormalMessage(userMessage);
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
      onAvatarStateChange?.('neutral');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNormalMessage = async (userMessage: string) => {
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
  };

  const handleYouTubeAnalysis = async (userMessage: string) => {
    // Extract YouTube URL from the message
    const youtubeUrlMatch = userMessage.match(/(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    
    if (!youtubeUrlMatch) {
      throw new Error('No valid YouTube URL found in message');
    }

    let youtubeUrl = youtubeUrlMatch[0];
    if (!youtubeUrl.startsWith('http')) {
      youtubeUrl = `https://${youtubeUrl}`;
    }

    // Create user message first
    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: "user",
      personalityMode: null,
      timestamp: new Date(),
      userId: "1"
    };

    setMessages(prev => [...prev, userMsg]);

    // Show analyzing message
    const analyzingMsg: Message = {
      id: (Date.now() + 1).toString(),
      content: "🎥 Analyzing this YouTube video for you... This might take a moment!",
      role: "assistant",
      personalityMode: null,
      timestamp: new Date(),
      userId: "2"
    };

    setMessages(prev => [...prev, analyzingMsg]);

    try {
      // Call the YouTube analysis API
      const response = await fetch("/api/analyze-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: youtubeUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'YouTube analysis failed');
      }

      const analysisData = await response.json();
      
      // Remove the analyzing message
      setMessages(prev => prev.filter(msg => msg.id !== analyzingMsg.id));
      
      // Create AI response message with YouTube analysis
      const aiMsg: Message = {
        id: (Date.now() + 2).toString(),
        content: analysisData.message,
        role: "assistant",
        personalityMode: null,
        timestamp: new Date(),
        userId: "2"
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // Add to conversation memory
      addExchange(userMessage, analysisData.message);

      // Set avatar to responding state
      onAvatarStateChange?.('responding');
      
      // Reset to neutral after a delay
      setTimeout(() => {
        onAvatarStateChange?.('neutral');
      }, 3000);

    } catch (error) {
      console.error("YouTube analysis error:", error);
      
      // Remove the analyzing message
      setMessages(prev => prev.filter(msg => msg.id !== analyzingMsg.id));
      
      const errorMessage = error instanceof Error ? error.message : "I had trouble analyzing that YouTube video, sweetheart. Could you double-check the URL and try again?";
      
      // Add error message to chat
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        content: errorMessage,
        role: "assistant",
        personalityMode: null,
        timestamp: new Date(),
        userId: "2"
      };

      setMessages(prev => [...prev, errorMsg]);
      
      // Add to conversation memory
      addExchange(userMessage, errorMessage);
    }
  };

  const handleRepositoryAnalysis = async (userMessage: string) => {
    // Extract GitHub URL from the message
    const githubUrlMatch = userMessage.match(/https?:\/\/github\.com\/[^\/\s]+\/[^\/\s]+/i) ||
                           userMessage.match(/github\.com\/[^\/\s]+\/[^\/\s]+/i);
    
    let repositoryUrl = '';
    if (githubUrlMatch) {
      repositoryUrl = githubUrlMatch[0];
      if (!repositoryUrl.startsWith('http')) {
        repositoryUrl = 'https://' + repositoryUrl;
      }
    }

    // Add user message to chat
    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: "user",
      personalityMode: null,
      timestamp: new Date(),
      userId: "1"
    };
    setMessages(prev => [...prev, userMsg]);

    // Add to conversation memory
    addExchange(userMessage, "");

    try {
      const response = await fetch("/api/analyze-repository", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryUrl: repositoryUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Repository analysis failed');
      }

      const analysisData = await response.json();
      
      // Create AI response message with repository analysis
      let analysisContent = analysisData.analysis;
      
      // Add repository actions marker that will be detected by the frontend
      analysisContent += `\n\n[REPO_ACTIONS:${repositoryUrl}]`;
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: analysisContent,
        role: "assistant",
        personalityMode: null,
        timestamp: new Date(),
        userId: "2"
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // Store repository URL for later use
      (window as any).lastRepositoryUrl = repositoryUrl;
      
      // Add to conversation memory
      addExchange("", analysisContent);

      // Set avatar to responding state
      onAvatarStateChange?.('responding');
      
      // Reset to neutral after a delay
      setTimeout(() => {
        onAvatarStateChange?.('neutral');
      }, 3000);

    } catch (error) {
      console.error("Repository analysis error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "I had trouble analyzing that repository, sweetheart. Could you double-check the URL and try again?";
      
      // Add error message to chat
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        role: "assistant",
        personalityMode: null,
        timestamp: new Date(),
        userId: "2"
      };

      setMessages(prev => [...prev, errorMsg]);
      
      // Add error response to conversation memory
      addExchange("", errorMessage);
      
      onAvatarStateChange?.('neutral');
    }
  };

  const handleRepositoryImprovements = async (userMessage: string) => {
    // Find the most recent repository URL from chat history or window storage
    let repositoryUrl = '';
    
    // Check if URL is in the current message
    const githubUrlMatch = userMessage.match(/https?:\/\/github\.com\/[^\/\s]+\/[^\/\s]+/i) ||
                          userMessage.match(/github\.com\/[^\/\s]+\/[^\/\s]+/i);
    
    if (githubUrlMatch) {
      repositoryUrl = githubUrlMatch[0];
      if (!repositoryUrl.startsWith('http')) {
        repositoryUrl = 'https://' + repositoryUrl;
      }
    } else {
      // Get from window storage
      repositoryUrl = (window as any).lastRepositoryUrl || '';
      
      // If not in window storage, search recent messages for GitHub URLs
      if (!repositoryUrl) {
        for (let i = messages.length - 1; i >= Math.max(0, messages.length - 10); i--) {
          const msg = messages[i];
          const urlMatch = msg.content.match(/https?:\/\/github\.com\/[^\/\s]+\/[^\/\s]+/i);
          if (urlMatch) {
            repositoryUrl = urlMatch[0];
            break;
          }
        }
      }
    }

    if (!repositoryUrl) {
      // No repository URL found
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: "I don't have a repository URL to work with, sweetheart. Could you share a GitHub repository link first?",
        role: "assistant",
        personalityMode: null,
        timestamp: new Date(),
        userId: "2"
      };
      setMessages(prev => [...prev, errorMsg]);
      addExchange("", errorMsg.content);
      return;
    }

    // Add user message to chat
    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: "user",
      personalityMode: null,
      timestamp: new Date(),
      userId: "1"
    };
    setMessages(prev => [...prev, userMsg]);
    addExchange(userMessage, "");

    try {
      // Add a loading message
      const loadingMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: "*analyzing the repository and generating improvement suggestions... this might take a moment, love* 💭",
        role: "assistant",
        personalityMode: null,
        timestamp: new Date(),
        userId: "2"
      };
      setMessages(prev => [...prev, loadingMsg]);

      const response = await fetch("/api/repository/improvements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryUrl: repositoryUrl
        }),
      });

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMsg.id));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate improvements');
      }

      const improvementsData = await response.json();
      
      // Format improvements as a friendly message
      let improvementText = `*smiles warmly* I've analyzed ${repositoryUrl} and have some suggestions for you!\n\n`;
      
      if (improvementsData.improvements && improvementsData.improvements.length > 0) {
        improvementsData.improvements.forEach((improvement: any, index: number) => {
          improvementText += `\n**${index + 1}. ${improvement.title}**\n`;
          improvementText += `${improvement.description}\n`;
          improvementText += `Files to modify: ${improvement.files.map((f: any) => f.path).join(', ')}\n`;
          improvementText += `Commit message: "${improvement.commitMessage}"\n`;
        });
        
        improvementText += `\n\n💡 These are actionable improvements you can apply to enhance your repository. Would you like me to provide more details about any of these suggestions?`;
      } else {
        improvementText = `I looked at the repository but couldn't generate specific improvements right now, love. The codebase might already be well-structured, or I might need more context. Feel free to ask me about specific areas you'd like to improve!`;
      }
      
      const aiMsg: Message = {
        id: (Date.now() + 2).toString(),
        content: improvementText,
        role: "assistant",
        personalityMode: null,
        timestamp: new Date(),
        userId: "2"
      };

      setMessages(prev => [...prev, aiMsg]);
      addExchange("", improvementText);

      onAvatarStateChange?.('responding');
      setTimeout(() => {
        onAvatarStateChange?.('neutral');
      }, 3000);

    } catch (error) {
      console.error("Repository improvement generation error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "I had trouble generating improvements for that repository, sweetheart. Want to try again?";
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        role: "assistant",
        personalityMode: null,
        timestamp: new Date(),
        userId: "2"
      };

      setMessages(prev => [...prev, errorMsg]);
      addExchange("", errorMessage);
      onAvatarStateChange?.('neutral');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Extract repository URL from message content if it contains REPO_ACTIONS marker
  const extractRepoUrl = (content: string): string | null => {
    const match = content.match(/\[REPO_ACTIONS:([^\]]+)\]/);
    return match ? match[1] : null;
  };

  // Remove the REPO_ACTIONS marker from message content for display
  const cleanMessageContent = (content: string): string => {
    return content.replace(/\[REPO_ACTIONS:[^\]]+\]/g, '').trim();
  };

  // Handle "Suggest Improvements" button click
  const handleSuggestImprovements = async (repoUrl: string) => {
    // Set loading state
    setIsLoading(true);
    onAvatarStateChange?.('thinking');

    // Store the repo URL for the function to use
    (window as any).lastRepositoryUrl = repoUrl;

    try {
      // Call the improvements handler (it will add the user message internally)
      await handleRepositoryImprovements("suggest improvements");
    } catch (error) {
      console.error("Error suggesting improvements:", error);
    } finally {
      setIsLoading(false);
      onAvatarStateChange?.('neutral');
    }
  };

  // Handle "View Repository" button click
  const handleViewRepository = (repoUrl: string) => {
    window.open(repoUrl, '_blank');
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
        
        {messages.map((message) => {
          const repoUrl = extractRepoUrl(message.content);
          const cleanContent = cleanMessageContent(message.content);
          
          return (
            <div key={message.id} className="flex flex-col">
              <div className="flex">
                <div className={getMessageBubbleClass(message.role)}>
                  <div className="whitespace-pre-wrap break-words">
                    {cleanContent}
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
              
              {/* Interactive buttons for repository analysis */}
              {repoUrl && message.role === "assistant" && (
                <div className="flex gap-2 mt-2 ml-0 mr-auto">
                  <Button
                    onClick={() => handleSuggestImprovements(repoUrl)}
                    className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500 text-white text-sm px-3 py-1.5 rounded-lg transition-all duration-200"
                    size="sm"
                  >
                    💡 Suggest Improvements
                  </Button>
                  <Button
                    onClick={() => handleViewRepository(repoUrl)}
                    className="bg-gradient-to-r from-gray-600/80 to-gray-700/80 hover:from-gray-600 hover:to-gray-700 text-white text-sm px-3 py-1.5 rounded-lg transition-all duration-200"
                    size="sm"
                  >
                    📁 View Repository
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        
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
        {/* URL Detection Indicator */}
        {detectedUrlType && (
          <div className={`mb-2 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 ${
            detectedUrlType === 'youtube' 
              ? 'bg-red-500/20 border border-red-400/30 text-red-300' 
              : 'bg-blue-500/20 border border-blue-400/30 text-blue-300'
          }`}>
            {detectedUrlType === 'youtube' ? (
              <>
                <span>🎥</span>
                <span>YouTube video detected - I'll analyze it for you!</span>
              </>
            ) : (
              <>
                <span>📁</span>
                <span>GitHub repository detected - I'll analyze it for you!</span>
              </>
            )}
          </div>
        )}
        
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className={`resize-none bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl backdrop-blur-sm focus:border-pink-400/50 focus:ring-pink-400/25 min-h-[40px] max-h-32 transition-all duration-200 ${
                detectedUrlType === 'youtube' 
                  ? 'border-red-400/50 focus:border-red-400/70' 
                  : detectedUrlType === 'github' 
                  ? 'border-blue-400/50 focus:border-blue-400/70' 
                  : ''
              }`}
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
  );
}
