import React, { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "milla";
  timestamp: Date;
}

export default function ChatInterface() {
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

  const handleSend = async () => {
    if (input.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: input,
        sender: "user",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      const messageToSend = input;
      setInput("");
      setIsLoading(true);

      // Replace this with a real backend call
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageToSend }),
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
        
        // Provide more specific error messages based on error type
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

  const displayMessages = messages.slice(-10);

  return (

    <div className="absolute right-6 top-6 bottom-6 w-96 flex flex-col z-10">
      <div className="flex-1 mb-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl h-full flex flex-col">
          <div className="p-4 border-b border-white/20">
            <h2 className="text-black font-semibold text-lg">Chat with Milla</h2>
            <p className="text-gray-700 text-sm">Showing last 10 messages</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} message-fade-in`}
              >

                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                    message.sender === "user"
                      ? "bg-blue-500/90 text-white rounded-br-md backdrop-blur-sm"
                      : "bg-white/90 text-gray-800 rounded-bl-md backdrop-blur-sm"
                  }`}
                >

                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-2 ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl p-4">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            placeholder="Type your message..."
            aria-label="Type your message"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-6 py-3 bg-blue-500/90 text-white rounded-lg hover:bg-blue-600/90 disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg backdrop-blur-sm border border-white/20 font-medium"
            aria-label="Send message"
          >
            Send
          </button>

        </div>
      </div>
    </div>
  );
}