import React, { useState } from "react";
const BACKGROUND_IMAGE = "/attached_assets/6124451be476ac0007e3face_bdd6ecce-c0f8-48c9-98c1-183aef053c3a_1756909651397.jpg";

export default function ChatInterface() {
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
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundImage: `url(${BACKGROUND_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 500, margin: "0 auto", background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, minHeight: 400, boxShadow: "0 4px 32px rgba(0,0,0,0.2)" }}>
          <div style={{ marginBottom: 16, minHeight: 300, overflowY: "auto" }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ color: "#fff", marginBottom: 8, padding: 8, background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                {msg}
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", outline: "none" }}
            />
            <button type="submit" style={{ padding: "0 16px", borderRadius: 8, background: "#fff", color: "#222", border: "none", fontWeight: "bold" }}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
