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
                onClick={toggleListening}
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
            )}
            <Button
              onClick={onSendMessage}
              disabled={isLoading || !message.trim()}
              size={getButtonSize()}
              className="flex-1"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
