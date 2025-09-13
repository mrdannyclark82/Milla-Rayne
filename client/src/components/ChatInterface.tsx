import React, { useState, useEffect, useRef } from "react";
import Calendar from "./ui/calendar"; // Make sure you have a default export!

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch personal tasks from backend (adjust endpoint as needed)
  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch("/api/personal-tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch {
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Send message to backend API for AI response
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

      // Call backend for AI response
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageToSend }),
        });
        if (res.ok) {
          const data = await res.json();
          const millaResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: data.response || "I'm here to help!",
            sender: "milla",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, millaResponse]);
        } else {
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              text: "Sorry, I couldn't reach the AI service.",
              sender: "milla",
              timestamp: new Date()
            }
          ]);
        }
      } catch (err) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: "Error communicating with backend.",
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

  // Show last 10 messages
  const displayMessages = messages.slice(-10);

  // Drawer handlers
  const handleOpenDrawer = () => setDrawerOpen(true);
  const handleCloseDrawer = () => setDrawerOpen(false);

  // Calendar
  const handleShowCalendar = () => {
    setShowCalendar(true);
    setShowTasks(false);
    handleCloseDrawer();
  };

  // Tasks
  const handleShowTasks = async () => {
    setShowTasks(true);
    setShowCalendar(false);
    await fetchTasks();
    handleCloseDrawer();
  };

  // External apps
  const openVideoAnalyzer = () => window.open("/videoviewer.html", "_blank");
  const openAudioAnalyzer = () => window.open("/listen.html", "_blank");

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* App List Button - bottom left */}
      <div className="fixed bottom-6 left-6 z-20">
        <button
          className="px-4 py-2 bg-muted/80 text-muted-foreground rounded-lg hover:bg-muted/60 transition-colors duration-200 shadow border border-white/10"
          style={{ opacity: 0.7 }}
          onClick={handleOpenDrawer}
          aria-label="Open app list"
        >
          <span role="img" aria-label="Apps">🟦</span> Apps
        </button>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div
          className="fixed top-0 left-0 h-full w-72 bg-gray-900/80 shadow-xl z-40 flex flex-col pt-10 px-6 transition-all duration-300 max-w-[90vw] sm:w-72"
          style={{ borderTopRightRadius: "1rem", borderBottomRightRadius: "1rem" }}
        >
          <button className="mb-6 text-muted-foreground hover:text-white self-end" aria-label="Close drawer" onClick={handleCloseDrawer}>✕</button>
          <h2 className="text-white text-lg font-semibold mb-4">App Features</h2>
          <ul className="space-y-2">
            <li>
              <button className="w-full text-left px-2 py-2 rounded hover:bg-gray-800/40" onClick={handleShowCalendar}>
                📅 Calendar
              </button>
            </li>
            <li>
              <button className="w-full text-left px-2 py-2 rounded hover:bg-gray-800/40" onClick={handleShowTasks}>
                🗒️ Task Reminders
              </button>
            </li>
            <li>
              <button className="w-full text-left px-2 py-2 rounded hover:bg-gray-800/40" onClick={openVideoAnalyzer}>
                🎥 Video Analyzer
              </button>
            </li>
            <li>
              <button className="w-full text-left px-2 py-2 rounded hover:bg-gray-800/40" onClick={openAudioAnalyzer}>
                🎧 Audio Analyzer
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md relative">
            <button className="absolute top-2 right-4 text-gray-500 hover:text-red-500" onClick={() => setShowCalendar(false)}>✕</button>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Calendar</h3>
            <Calendar />
          </div>
        </div>
      )}

      {/* Tasks Modal */}
      {showTasks && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md relative">
            <button className="absolute top-2 right-4 text-gray-500 hover:text-red-500" onClick={() => setShowTasks(false)}>✕</button>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Tasks</h3>
            {loadingTasks ? (
              <div className="text-gray-500">Loading tasks...</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {tasks.length === 0 && <li className="py-2 text-gray-500">No tasks found.</li>}
                {tasks.map((task: any) => (
                  <li key={task.id} className="py-2">
                    <span className="font-medium">{task.title}</span>
                    <span className="ml-2 text-xs text-gray-400">{task.status}</span>
                    <div className="text-sm text-gray-600">{task.description}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Chat Area (right side) - Fixed positioning for consistent placement */}
      <div className="fixed right-4 top-4 bottom-4 w-80 sm:w-96 flex flex-col z-10 max-w-[calc(100vw-2rem)]">
        {/* Chat Messages Area (last 10 messages) */}
        <div className="flex-1 mb-4 min-h-0">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl h-full flex flex-col">
            <div className="p-4 border-b border-white/20 shrink-0">
              <h2 className="text-white font-semibold text-lg">Chat with Milla</h2>
              <p className="text-white/70 text-sm">Showing last 10 messages</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll min-h-0">
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
                    <p className="text-sm leading-relaxed break-words">{message.text}</p>
                    <p className={`text-xs mt-2 ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start message-fade-in">
                  <div className="bg-white/90 text-gray-800 rounded-bl-md backdrop-blur-sm px-4 py-3 rounded-2xl shadow-sm">
                    <p className="text-sm">Milla is typing...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Chat Input - bottom right */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl p-4 shrink-0">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-sm"
              placeholder="Type your message..."
              aria-label="Type your message"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-500/90 text-white rounded-lg hover:bg-blue-600/90 disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg backdrop-blur-sm border border-white/20 font-medium text-sm"
              aria-label="Send message"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}