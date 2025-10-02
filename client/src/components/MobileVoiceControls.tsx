import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface MobileVoiceControlsProps {
  onStartListening: () => void;
  onStopListening: () => void;
  isListening: boolean;
  onCancel: () => void;
  className?: string;
}

export function MobileVoiceControls({
  onStartListening,
  onStopListening,
  isListening,
  onCancel,
  className = ""
}: MobileVoiceControlsProps) {
  const [isPressHold, setIsPressHold] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    
    // Start hold-to-talk after 200ms
    holdTimerRef.current = setTimeout(() => {
      setIsPressHold(true);
      onStartListening();
      
      // Haptic feedback (if available)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 200);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPressHold) return;

    const touch = e.touches[0];
    const deltaX = startPosRef.current.x - touch.clientX;
    const deltaY = touch.clientY - startPosRef.current.y;

    // Detect swipe to cancel (swipe left or up)
    if (deltaX > 50 || deltaY < -50) {
      setSwipeDistance(Math.max(deltaX, -deltaY));
      
      if (deltaX > 100 || deltaY < -100) {
        handleCancel();
      }
    }
  };

  const handleTouchEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    if (isPressHold) {
      onStopListening();
      setIsPressHold(false);
      
      // Haptic feedback (if available)
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }

    setSwipeDistance(0);
  };

  const handleCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    setIsPressHold(false);
    setSwipeDistance(0);
    onCancel();
    
    // Haptic feedback (if available)
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <Button
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`w-20 h-20 rounded-full transition-all ${
            isPressHold
              ? 'bg-red-600 scale-110 shadow-lg shadow-red-500/50'
              : 'bg-green-600 hover:bg-green-700'
          }`}
          style={{
            transform: `scale(${isPressHold ? 1.1 : 1}) translateX(-${swipeDistance}px)`
          }}
          aria-label="Press and hold to speak"
        >
          <i className={`fas fa-microphone text-2xl ${isPressHold ? 'animate-pulse' : ''}`}></i>
        </Button>

        <div className="text-center">
          {!isPressHold && (
            <p className="text-xs text-white/60">Press & hold to speak</p>
          )}
          {isPressHold && (
            <>
              <p className="text-xs text-white/80 animate-pulse">Listening...</p>
              <p className="text-xs text-white/40 mt-1">
                <i className="fas fa-arrow-left mr-1"></i>
                Swipe to cancel
              </p>
            </>
          )}
        </div>
      </div>

      {/* Visual feedback for swipe */}
      {swipeDistance > 50 && (
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-red-400 animate-pulse">
          <i className="fas fa-times-circle text-2xl"></i>
        </div>
      )}
    </div>
  );
}
