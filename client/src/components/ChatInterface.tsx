import React, { useState } from "react";
const BACKGROUND_IMAGE = "/attached_assets/6124451be476ac0007e3face_bdd6ecce-c0f8-48c9-98c1-183aef053c3a_1756909651397.jpg";

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
      {/* Calendar and Tasks buttons */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
        <button onClick={handleOpenCalendar}>Open Calendar</button>
        <button onClick={handleOpenTasks}>Open Tasks</button>
      </div>
      <div style={{ width: "100%", maxWidth: 600, marginBottom: "1rem" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ background: "rgba(255,255,255,0.8)", margin: "0.5rem 0", padding: "0.5rem", borderRadius: "8px" }}>
            {msg}
          </div>
        ))}
      </div>
      <div style={{ width: "100%", maxWidth: 600, display: "flex" }}>
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
  );
}