import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FloatingInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  isListening: boolean;
  toggleListening: () => void;
  isMobile: boolean;
  getButtonSize: () => 'sm' | 'default' | 'lg' | 'icon' | null | undefined;
  MobileVoiceControls?: React.ComponentType<any>;
  cancelListening?: () => void;
  onSendAudio: (audio: Blob) => void;
  onSendFaraTask: (task: string) => void;
}

export function FloatingInput({
  message,
  setMessage,
  onSendMessage,
  isLoading,
  isListening,
  toggleListening,
  isMobile,
  getButtonSize,
  MobileVoiceControls,
  cancelListening,
  onSendAudio,
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl transition-all duration-300 ${
        isFocused
          ? 'bg-white/10 border border-[#00f2ff]/50 shadow-[0_0_30px_rgba(0,242,255,0.2)]'
          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}>
        {/* AI indicator */}
        <div className={`flex-shrink-0 transition-all duration-300 ${isLoading ? 'animate-pulse' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isLoading
              ? 'bg-gradient-to-r from-[#00f2ff] to-[#ff00aa]'
              : 'bg-gradient-to-r from-[#00f2ff]/20 to-[#ff00aa]/20'
          }`}>
            <svg className={`w-4 h-4 ${isLoading ? 'text-white animate-spin' : 'text-[#00f2ff]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
            </svg>
          </div>
        </div>

        {/* Attachment button */}
        <button
          className="flex-shrink-0 p-2 text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300 rounded-xl"
          title="Attach file"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* Input field */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage();
            }
          }}
          placeholder="Type or Speak Command..."
          className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm focus:outline-none disabled:opacity-50"
          disabled={isLoading}
        />

        {/* Send button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSendMessage();
          }}
          disabled={isLoading || !message.trim()}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            message.trim() && !isLoading
              ? 'bg-gradient-to-r from-[#00f2ff] to-[#ff00aa] text-white shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:shadow-[0_0_30px_rgba(0,242,255,0.6)] hover:scale-105'
              : 'bg-white/5 text-white/30 border border-white/10'
          } disabled:cursor-not-allowed`}
          title="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>

        {/* Microphone button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleListening();
          }}
          disabled={isLoading}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isListening 
              ? 'bg-[#ff00aa]/20 text-[#ff00aa] border border-[#ff00aa]/50 shadow-[0_0_20px_rgba(255,0,170,0.3)] animate-pulse' 
              : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>
      </div>
      
      {/* Keyboard hint */}
      <div className="flex justify-center mt-2">
        <span className="text-xs text-white/30">Press Enter to send, or click the mic to speak</span>
      </div>
    </div>
  );
}
