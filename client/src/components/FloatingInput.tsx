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
}: FloatingInputProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 500, height: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
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

  const handleMouseMove = (e: MouseEvent) => {
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

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

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

  return (
    <div
      ref={containerRef}
      className="fixed bg-gray-800/95 backdrop-blur-sm border-2 border-gray-600 rounded-lg shadow-2xl z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="h-full flex flex-col p-4 space-y-2">
        {/* Drag handle header */}
        <div className="text-gray-400 text-xs font-semibold flex justify-between items-center">
          <span>💬 Chat Input (Drag to move)</span>
          <span className="text-gray-500">✕</span>
        </div>

        {/* Input area */}
        {isMobile ? (
          <div className="flex flex-col gap-2 flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 resize-none"
              disabled={isLoading}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2 items-center justify-between">
              {MobileVoiceControls && cancelListening && (
                <MobileVoiceControls
                  onStartListening={toggleListening}
                  onStopListening={toggleListening}
                  isListening={isListening}
                  onCancel={cancelListening}
                />
              )}
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
          <div className="flex flex-col gap-2 flex-1">
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
            <div className="flex gap-2">
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
                {isListening ? '🎤' : '🎙️'}
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendMessage();
                }}
                disabled={isLoading || !message.trim()}
                size={getButtonSize()}
                className="flex-1"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #4b5563 50%)',
        }}
      />
    </div>
  );
}
