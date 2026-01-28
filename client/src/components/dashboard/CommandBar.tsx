import { useState, useRef } from 'react';
import { Send, Mic, MicOff, Sparkles } from 'lucide-react';

interface CommandBarProps {
  onSendMessage?: (message: string) => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
  isListening?: boolean;
  isLoading?: boolean;
}

export function CommandBar({
  onSendMessage,
  onStartListening,
  onStopListening,
  isListening = false,
  isLoading = false,
}: CommandBarProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage?.(message);
      setMessage('');
    }
  };

  const handleMicClick = async () => {
    if (isListening) {
      onStopListening?.();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        onStartListening?.();
      } catch (err) {
        console.error('Microphone access denied:', err);
        alert('Please allow microphone access to use voice commands.');
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="relative max-w-5xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00f2ff]/10 via-[#120428]/40 to-[#ff00aa]/10 blur-3xl pointer-events-none" />
        <form onSubmit={handleSubmit}>
          <div
            className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-3xl transition-all duration-300 border ${
              isFocused
                ? 'bg-white/10 border-[#00f2ff]/50 shadow-[0_0_40px_rgba(0,242,255,0.25)]'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            {/* AI indicator */}
            <div className={`flex-shrink-0 transition-all duration-300 ${isLoading ? 'animate-pulse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isLoading
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#ff00aa] animate-spin'
                  : 'bg-gradient-to-r from-[#00f2ff]/20 to-[#ff00aa]/20'
              }`}>
                <Sparkles className={`w-4 h-4 ${isLoading ? 'text-white' : 'text-[#00f2ff]'}`} />
              </div>
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type or Speak Command..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm focus:outline-none disabled:opacity-50"
            />

            {/* Voice button */}
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? 'bg-[#ff00aa]/20 text-[#ff00aa] border border-[#ff00aa]/50 shadow-[0_0_20px_rgba(255,0,170,0.3)] animate-pulse'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                message.trim() && !isLoading
                  ? 'bg-gradient-to-r from-[#00f2ff] to-[#ff00aa] text-white shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:shadow-[0_0_30px_rgba(0,242,255,0.6)] hover:scale-105'
                  : 'bg-white/5 text-white/30 border border-white/10'
              } disabled:cursor-not-allowed`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Keyboard hint */}
        <div className="flex justify-center mt-2">
          <span className="text-xs text-white/30">Press Enter to send, or click the mic to speak</span>
        </div>
      </div>
    </div>
  );
}

export default CommandBar;
