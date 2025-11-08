import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface VoiceControlsProps {
  isSpeaking: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReplay: () => void;

  // Optional caption controls
  showCaptions?: boolean;
  onToggleCaptions?: (next: boolean) => void;

  className?: string;
}

export function VoiceControls({
  isSpeaking,
  onPause,
  onResume,
  onStop,
  onReplay,

  className = '',
  showCaptions = false,
  onToggleCaptions,
}: VoiceControlsProps) {
  const [isPaused, setIsPaused] = useState(false);

  const handlePauseResume = () => {
    if (isPaused) {
      onResume();
      setIsPaused(false);
    } else {
      onPause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    onStop();
    setIsPaused(false);
  };

  // Reset pause state when speaking stops
  useEffect(() => {
    if (!isSpeaking) {
      setIsPaused(false);
    }
  }, [isSpeaking]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isSpeaking && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="border-white/30 text-white/70 hover:text-white"
            onClick={handlePauseResume}
            title={isPaused ? 'Resume' : 'Pause'}
            aria-label={isPaused ? 'Resume speech' : 'Pause speech'}
          >
            <i className={`fas fa-${isPaused ? 'play' : 'pause'} mr-1`}></i>
            {isPaused ? 'Resume' : 'Pause'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/30 text-white/70 hover:text-white"
            onClick={handleStop}
            title="Stop"
            aria-label="Stop speech"
          >
            <i className="fas fa-stop mr-1"></i>
            Stop
          </Button>
        </>
      )}

      {!isSpeaking && (
        <Button
          size="sm"
          variant="outline"
          className="border-white/30 text-white/70 hover:text-white"
          onClick={onReplay}
          title="Replay last message"
          aria-label="Replay last message"
        >
          <i className="fas fa-redo mr-1"></i>
          Replay
        </Button>
      )}
      {/* Captions toggle - always available */}
      <Button
        size="sm"
        variant={showCaptions ? 'default' : 'outline'}
        className="border-white/30 text-white/70 hover:text-white"
        onClick={() => onToggleCaptions?.(!showCaptions)}
        title={showCaptions ? 'Hide captions' : 'Show captions'}
        aria-pressed={showCaptions}
      >
        <i className="fas fa-closed-captioning mr-1"></i>
        CC
      </Button>
    </div>
  );
}
