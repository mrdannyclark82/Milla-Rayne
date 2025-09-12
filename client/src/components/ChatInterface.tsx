import React, { useState, useEffect } from "react";
import { apiRequest } from "../lib/queryClient";

const BACKGROUND_IMAGE = "/attached_assets/6124451be476ac0007e3face_bdd6ecce-c0f8-48c9-98c1-183aef053c3a_1756909651397.jpg";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load existing messages on component mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await apiRequest("GET", "/api/messages");
        const existingMessages = await res.json();
        setMessages(existingMessages);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    loadMessages();
  }, []);

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = input.trim();
      setInput("");
      setIsLoading(true);

      try {
        // Send message to API
        const res = await apiRequest("POST", "/api/messages", {
          content: userMessage,
          role: "user",
          userId: null, // You can add user identification later
        });
        
        const response = await res.json();
        
        // Update messages with both user message and any AI responses
        setMessages(prev => {
          const newMessages = [...prev, response.userMessage];
          
          // Add AI response if Milla decided to respond
          if (response.aiMessage) {
            newMessages.push(response.aiMessage);
          }
          
          // Add any follow-up messages
          if (response.followUpMessages && response.followUpMessages.length > 0) {
            newMessages.push(...response.followUpMessages);
          }
          
          return newMessages;
        });
        
      } catch (error) {
        console.error("Failed to send message:", error);
        // Add error message to chat
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: "Sorry, there was an error sending your message. Please try again.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url('${BACKGROUND_IMAGE}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 600, marginBottom: "1rem", maxHeight: "70vh", overflowY: "auto" }}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            style={{ 
              background: msg.role === "user" ? "rgba(135, 206, 235, 0.9)" : "rgba(255, 255, 255, 0.9)", 
              margin: "0.5rem 0", 
              padding: "0.75rem", 
              borderRadius: "12px",
              marginLeft: msg.role === "user" ? "2rem" : "0",
              marginRight: msg.role === "user" ? "0" : "2rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "0.85em", marginBottom: "0.25rem", color: "#555" }}>
              {msg.role === "user" ? "You" : "Milla"}
            </div>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ 
            background: "rgba(255, 255, 255, 0.9)", 
            margin: "0.5rem 0", 
            padding: "0.75rem", 
            borderRadius: "12px",
            marginRight: "2rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            fontStyle: "italic"
          }}>
            <div style={{ fontWeight: "bold", fontSize: "0.85em", marginBottom: "0.25rem", color: "#555" }}>
              Milla
            </div>
            Thinking...
          </div>
        )}
      </div>
      <div style={{ width: "100%", maxWidth: 600, display: "flex" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          style={{ 
            flex: 1, 
            padding: "0.75rem", 
            borderRadius: "12px 0 0 12px", 
            border: "1px solid #ccc",
            fontSize: "1rem",
            opacity: isLoading ? 0.6 : 1
          }}
          placeholder="Type your message..."
          onKeyDown={e => { if (e.key === "Enter" && !isLoading) handleSend(); }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{ 
            padding: "0.75rem 1.5rem", 
            borderRadius: "0 12px 12px 0", 
            border: "1px solid #ccc", 
            background: isLoading || !input.trim() ? "#ccc" : "#007bff", 
            color: "#fff",
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "1rem"
          }}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}