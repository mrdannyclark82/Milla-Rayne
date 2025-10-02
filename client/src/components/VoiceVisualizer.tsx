import { useEffect, useRef, useState } from "react";

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  className?: string;
}

export function VoiceVisualizer({ isListening, isSpeaking, className = "" }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  useEffect(() => {
    if (isListening && !audioContextRef.current) {
      initializeAudioContext();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);

  const initializeAudioContext = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      drawVisualization();
    } catch (error) {
      console.error("Error initializing audio context:", error);
    }
  };

  const drawVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current || !canvasContext) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      canvasContext.fillStyle = "rgba(0, 0, 0, 0.1)";
      canvasContext.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const gradient = canvasContext.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, "#22c55e");
        gradient.addColorStop(0.5, "#4ade80");
        gradient.addColorStop(1, "#86efac");

        canvasContext.fillStyle = gradient;
        canvasContext.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      // Calculate volume level for VU meter
      const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      setVolumeLevel(average / 255);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Simple VU meter visualization when speaking
  const renderVUMeter = () => {
    const bars = 20;
    const filledBars = Math.floor(volumeLevel * bars);
    
    return (
      <div className="flex items-center gap-1 h-full">
        {Array.from({ length: bars }).map((_, i) => {
          const isActive = i < filledBars;
          let color = "bg-green-500";
          if (i > bars * 0.8) color = "bg-red-500";
          else if (i > bars * 0.6) color = "bg-yellow-500";

          return (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all ${
                isActive ? color : "bg-white/10"
              }`}
              style={{ height: `${20 + (i / bars) * 80}%` }}
            />
          );
        })}
      </div>
    );
  };

  // Speaking animation - pulsing circles
  const renderSpeakingAnimation = () => {
    return (
      <div className="flex items-center justify-center gap-2 h-full">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
        <div className="w-4 h-4 bg-green-600 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: "450ms" }} />
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "600ms" }} />
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {isListening ? (
        <>
          <canvas
            ref={canvasRef}
            width={300}
            height={60}
            className="w-full h-full rounded-lg bg-black/50"
          />
          <div className="absolute bottom-1 right-2 text-xs text-green-400">
            <i className="fas fa-microphone mr-1"></i>
            Listening...
          </div>
        </>
      ) : isSpeaking ? (
        <>
          <div className="w-full h-full bg-black/50 rounded-lg p-2">
            {renderSpeakingAnimation()}
          </div>
          <div className="absolute bottom-1 right-2 text-xs text-green-400">
            <i className="fas fa-volume-up mr-1"></i>
            Speaking...
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-black/50 rounded-lg flex items-center justify-center text-gray-500 text-sm">
          <i className="fas fa-waveform-lines mr-2"></i>
          Voice inactive
        </div>
      )}
    </div>
  );
}
