import React, { useState, useRef, useEffect } from 'react';
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
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 500, height: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (isResizing) {
        const newWidth = Math.max(
          300,
          resizeStart.width + (e.clientX - resizeStart.x)
        );
        const newHeight = Math.max(
          100,
          resizeStart.height + (e.clientY - resizeStart.y)
        );
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, position, size]);

  // Handle resize
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        onSendAudio(audioBlob);
        audioChunksRef.current = [];
        setIsRecording(false);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-full px-3 py-2">
        {/* Attachment button */}
        <button
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-700/50"
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
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage();
            }
          }}
          placeholder="Message Milla..."
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 text-sm"
          disabled={isLoading}
        />

        {/* Send button - pink/red circle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSendMessage();
          }}
          disabled={isLoading || !message.trim()}
          className="p-2 bg-pink-500 hover:bg-pink-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-full transition-colors"
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
          className={`p-2 rounded-full transition-colors ${
            isListening 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
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
    </div>
  );
}
