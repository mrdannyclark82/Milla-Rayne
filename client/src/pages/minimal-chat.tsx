import React, { useState } from "react";

const BACKGROUND_IMAGE = "/background.jpg";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export default function MinimalChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: input.trim(),
        role: 'user',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // Send message to API
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: input.trim(),
            role: "user",
          }),
        });

        const data = await response.json();
        
        if (data.aiMessage && data.aiMessage.content) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: data.aiMessage.content,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I'm having trouble connecting right now. Please try again.",
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-full"
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background overlay for better contrast */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      
      {/* Centered chat container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div 
          className="w-full max-w-md mx-auto"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Messages container */}
          <div 
            className="p-6 pb-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            style={{ minHeight: "200px" }}
          >
            {messages.length === 0 ? (
              <div className="text-center text-white/60 text-sm italic">
                Start a conversation with Milla...
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`mb-3 p-3 rounded-xl text-sm leading-relaxed message-fade-in ${
                    msg.role === 'user' 
                      ? 'ml-4 text-white/90 bg-blue-500/20' 
                      : 'mr-4 text-white/90 bg-white/12'
                  }`}
                  style={{
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-white/50">
                      {msg.role === 'user' ? 'You' : 'Milla'}
                    </span>
                    <span className="text-xs text-white/40">{msg.timestamp}</span>
                  </div>
                  {msg.content}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-pulse text-white/60 text-sm">
                  Milla is typing...
                </div>
              </div>
            )}
          </div>
          
          {/* Input form */}
          <form onSubmit={handleSend} className="p-6 pt-2">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  color: "white",
                }}
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}