import React, { useState } from "react";

const BACKGROUND_IMAGE = "/background.jpg";

export default function MinimalChat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, input.trim()]);
      setInput("");
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
                Start a conversation...
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className="mb-3 p-3 rounded-xl text-white/90 text-sm leading-relaxed message-fade-in"
                  style={{
                    background: "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {msg}
                </div>
              ))
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
                className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/30"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  color: "white",
                }}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}