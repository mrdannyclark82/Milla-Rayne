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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
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
    <div className="fixed bottom-0 left-0 right-0 p-2 sm:p-4 bg-transparent z-50">
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative flex flex-col gap-2 bg-black/80 backdrop-blur-lg border border-white/10 rounded-xl p-2 sm:p-4 shadow-2xl">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendMessage();
              }
            }}
            placeholder={
              isMobile
                ? 'Type your message...'
                : 'Type your message or click the microphone to speak...'
            }
            className="w-full px-4 py-2 bg-gray-900/80 border border-gray-700/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <div className="flex gap-2 items-center">
            {isMobile && MobileVoiceControls && cancelListening ? (
              <MobileVoiceControls
                onStartListening={toggleListening}
                onStopListening={toggleListening}
                isListening={isListening}
                onCancel={cancelListening}
              />
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendMessage();
                }}
                disabled={isLoading || !message.trim()}
                className="flex-1"
                size={getButtonSize()}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 flex-1 h-full">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Type your message or click the microphone to speak..."
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 resize-none"
              disabled={isLoading}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex flex-col gap-2 justify-end">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleListening();
                }}
                variant={isListening ? 'default' : 'outline'}
                disabled={isLoading}
                title="Click to speak"
                className={isListening ? 'animate-pulse' : ''}
                size={getButtonSize()}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
                aria-pressed={isListening}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isRecording) {
                    mediaRecorderRef.current?.stop();
                  } else {
                    startRecording();
                  }
                }}
                variant={isRecording ? 'destructive' : 'outline'}
                disabled={isLoading}
                title={isRecording ? 'Stop recording' : 'Start recording'}
                size={getButtonSize()}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  {isRecording && <circle cx="12" cy="12" r="4" fill="red" />}
                </svg>
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendMessage();
                }}
                disabled={isLoading || !message.trim()}
                size={getButtonSize()}
              >
                {isLoading ? (
                  'Sending...'
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z"/>
                    <path d="M22 2 11 13"/>
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Resize handle - bottom right corner */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize hover:bg-gray-600/50 transition-colors"
        onMouseDown={handleResizeMouseDown}
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #6b7280 50%)',
          borderBottomRightRadius: '0.5rem',
        }}
        title="Drag to resize"
      >
        <svg 
          className="absolute bottom-0.5 right-0.5 w-4 h-4 text-gray-400"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M15 14l-5-5m5 5l-5-5m5 5v-4m0 4h-4"/>
          <path d="M11 10l-4-4m4 4l-4-4"/>
          <path d="M7 6l-4-4m4 4l-4-4"/>
        </svg>
      </div>
    </div>
  );
}