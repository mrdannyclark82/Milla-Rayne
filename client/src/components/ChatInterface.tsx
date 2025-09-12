import React, { useState } from "react";

const BACKGROUND_IMAGE = "/attached_assets/6124451be476ac0007e3face_bdd6ecce-c0f8-48c9-98c1-183aef053c3a_1756909651397.jpg";

export default function ChatInterface() {
  const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim()) {
      setMessages([...messages, { sender: "user", text: input }]);
      setLoading(true);
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: input, role: "user" }),
        });
        const data = await res.json();
        // Assume data contains assistant response as 'content'
        setMessages(msgs => [...msgs, { sender: "assistant", text: data.content }]);
      } catch (err) {
        setMessages(msgs => [...msgs, { sender: "assistant", text: "Error contacting Milla Rayne server." }]);
      }
      setLoading(false);
      setInput("");
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
      <div style={{ width: "100%", maxWidth: 600, marginBottom: "1rem" }}>
        {messages.map((msg, idx) => (
          <div key={idx}
            style={{
              background: msg.sender === "assistant" ? "rgba(200,230,255,0.8)" : "rgba(255,255,255,0.8)",
              margin: "0.5rem 0",
              padding: "0.5rem",
              borderRadius: "8px"
            }}>
            <b>{msg.sender === "assistant" ? "Milla:" : "You:"}</b> {msg.text}
          </div>
        ))}
        {loading && <div style={{ margin: "0.5rem 0" }}>Milla is thinking...</div>}
      </div>
      <div style={{ width: "100%", maxWidth: 600, display: "flex" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, padding: "0.5rem", borderRadius: "8px 0 0 8px", border: "1px solid #ccc" }}
          placeholder="Type your message..."
          onKeyDown={e => { if (e.key === "Enter" && !loading) handleSend(); }}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          style={{ padding: "0.5rem 1rem", borderRadius: "0 8px 8px 0", border: "1px solid #ccc", background: "#007bff", color: "#fff" }}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}