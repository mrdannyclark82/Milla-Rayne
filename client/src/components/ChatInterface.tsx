import React, { useState, useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface Message {
  id: string;
  text: string;
  sender: "user" | "milla";
  timestamp: Date;
}

interface VideoAnalysisResult {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

interface ChatInterfaceProps {
  videoAnalysisResults?: VideoAnalysisResult[];
}

export default function ChatInterface({ videoAnalysisResults }: ChatInterfaceProps) {
  // Voice input state
  const {
    transcript,
    isListening,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Milla, your AI assistant. How can I help you today?",
      sender: "milla",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Unified send handler for both text and voice
  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : input;
    if (textToSend.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: textToSend,
        sender: "user",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setInput("");
      setIsLoading(true);

      // Replace this with a real backend call
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        // Include video analysis context if available
        let context = undefined;
        if (videoAnalysisResults && videoAnalysisResults.length > 0) {
          context = {
            detectedObjects: videoAnalysisResults.map(r => ({
              class: r.class,
              score: r.score,
              bbox: r.bbox
            }))
          };
        }
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: textToSend,
            context
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              text: data.response || "I'm here to help!",
              sender: "milla",
              timestamp: new Date()
            }
          ]);
        } else {
          // Handle different error status codes
          let errorMessage = "Sorry, I couldn't reach the AI service.";
          if (res.status === 400) {
            errorMessage = "There was an issue with your message format. Please try again.";
          } else if (res.status === 429) {
            errorMessage = "I'm getting a lot of messages right now. Please wait a moment and try again.";
          } else if (res.status >= 500) {
            errorMessage = "I'm experiencing some technical difficulties. Please try again in a moment.";
          }
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              text: errorMessage,
              sender: "milla",
              timestamp: new Date()
            }
          ]);
        }
      } catch (err) {
        console.error("Chat communication error:", err);
        let errorMessage = "Error communicating with backend.";
        if (err instanceof TypeError && err.message.includes('fetch')) {
          errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        } else if (err instanceof Error && err.name === 'AbortError') {
          errorMessage = "The request timed out. Please try again.";
        }
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: errorMessage,
            sender: "milla",
            timestamp: new Date()
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // When transcript changes and listening stops, send the transcript as a message
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      handleSend(transcript);
      resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const displayMessages = messages; // Show all messages now that we have scrolling

  return (
    <div className="chat-interface-container">
      <div className="flex-1 mb-4">
        <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl min-h-[400px] flex flex-col">
          <div className="p-3 sm:p-4 border-b border-white/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-base sm:text-lg drop-shadow-sm">Chat with Milla</h2>
                <p className="text-white/80 text-xs sm:text-sm">Chat History</p>
              </div>
              {videoAnalysisResults && videoAnalysisResults.length > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse drop-shadow-sm" />
                  <span className="text-xs text-green-100 font-medium drop-shadow-sm">Video Active</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 chat-scroll">
            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} message-fade-in`}
              >
                <div
                  className={`max-w-[250px] sm:max-w-xs px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-lg ${
                    message.sender === "user"
                      ? "bg-blue-500/95 text-white rounded-br-md backdrop-blur-sm border border-blue-400/30"
                      : "bg-white/95 text-gray-800 rounded-bl-md backdrop-blur-sm border border-white/40"
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-1 sm:mt-2 ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/30 backdrop-blur-sm border border-white/40 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent transition-all text-sm sm:text-base"
            placeholder="Type your message..."
            aria-label="Type your message"
          />
          {/* Voice input button */}
          {isVoiceSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`px-3 py-2 rounded-lg border border-blue-400/30 shadow-lg backdrop-blur-sm text-white transition-colors duration-200 font-medium text-base focus:outline-none ${isListening ? 'bg-blue-600/90 animate-pulse' : 'bg-blue-500/80 hover:bg-blue-600/90'}`}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              title={isListening ? "Stop voice input" : "Start voice input"}
            >
              {isListening ? '🎤...' : '🎤'}
            </button>
          )}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500/95 text-white rounded-lg hover:bg-blue-600/95 disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg backdrop-blur-sm border border-blue-400/30 font-medium text-sm sm:text-base"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}