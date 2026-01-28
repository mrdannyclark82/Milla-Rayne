import { MessageSquare, MoreHorizontal, Send, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: string;
  content: string;
  image?: string;
}

export function ChatThreadPanel({ onPlayVideo }: { onPlayVideo?: (videoId: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm Milla. I'm online and synced with your hub. How can I assist you today?" },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await response.json();
      
      if (data.response || data.content) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response || data.content,
          image: data.imageUrl || data.image_url // Support both casing
        }]);
        
        // Handle YouTube video playback
        if (data.youtube_play && data.youtube_play.videoId && onPlayVideo) {
            onPlayVideo(data.youtube_play.videoId);
        }
      } else if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${data.error}` 
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting to my neural network right now. Please try again." 
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_25px_120px_rgba(0,0,0,0.45)] flex flex-col h-[500px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#00f2ff] to-[#7c3aed] flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                    <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Live Thread</h3>
                    <p className="text-[10px] text-white/50">Milla Rayne • Active Now</p>
                </div>
            </div>
            <button className="text-white/40 hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
            </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                        msg.role === 'assistant'
                            ? 'bg-gradient-to-tr from-[#00f2ff] to-[#7c3aed] shadow-[0_0_10px_rgba(124,58,237,0.3)]'
                            : 'bg-white/10'
                    }`}>
                        {msg.role === 'assistant' ? (
                            <span className="text-xs font-bold text-white">M</span>
                        ) : (
                            <span className="text-xs font-bold text-white">You</span>
                        )}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'assistant'
                            ? 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none shadow-sm'
                            : 'bg-[#7c3aed]/20 border border-[#7c3aed]/30 text-white rounded-tr-none shadow-[0_0_15px_rgba(124,58,237,0.1)]'
                    }`}>
                        {msg.content}
                        {msg.image && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                                <img src={msg.image} alt="Generated content" className="w-full h-auto object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isSending && (
                <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#00f2ff] to-[#7c3aed] flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.3)]">
                        <span className="text-xs font-bold text-white">M</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 rounded-tl-none">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 focus-within:border-[#00f2ff]/50 focus-within:bg-white/10 transition-all">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Milla..."
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    disabled={isSending}
                />
                <button 
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isSending}
                    className={`p-2 rounded-lg transition-colors ${
                        !inputValue.trim() || isSending 
                            ? 'text-white/20' 
                            : 'text-[#00f2ff] hover:bg-[#00f2ff]/10'
                    }`}
                >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    </section>
  );
}