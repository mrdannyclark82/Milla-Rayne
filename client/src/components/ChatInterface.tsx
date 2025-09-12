import React, { useState } from "react";
const BACKGROUND_IMAGE = "/unnamed.jpg"; // Use public folder path

export default function ChatInterface() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
      setInput("");
    }
  };

  // Handlers for Calendar and Tasks buttons
  const handleOpenCalendar = () => {
    alert("Calendar feature coming soon!");
  };

  const handleOpenTasks = () => {
    alert("Task feature coming soon!");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundImage: `url('${BACKGROUND_IMAGE}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      {/* Overlay container on the right */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100vh",
          width: "400px",
          background: "rgba(255,255,255,0.85)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "2rem 1rem",
          boxShadow: "0 0 20px rgba(0,0,0,0.2)",
        }}
      >
        {/* Calendar and Tasks buttons */}
        <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
          <button onClick={handleOpenCalendar}>Open Calendar</button>
          <button onClick={handleOpenTasks}>Open Tasks</button>
        </div>
        {/* Chat thread */}
        <div style={{ width: "100%", maxWidth: 350, marginBottom: "1rem", flex: 1, overflowY: "auto" }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ background: "rgba(0,123,255,0.1)", margin: "0.5rem 0", padding: "0.5rem", borderRadius: "8px" }}>
              {msg}
            </div>
          ))}
        </div>
        {/* Input box and send button */}
        <div style={{ width: "100%", maxWidth: 350, display: "flex" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, padding: "0.5rem", borderRadius: "8px 0 0 8px", border: "1px solid #ccc" }}
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            style={{ padding: "0.5rem 1rem", borderRadius: "0 8px 8px 0", border: "1px solid #ccc", background: "#007bff", color: "#fff" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}