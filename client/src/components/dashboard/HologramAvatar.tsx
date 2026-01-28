import { useState, useEffect, useRef } from 'react';

interface HologramAvatarProps {
  avatarState?: 'idle' | 'listening' | 'thinking' | 'speaking';
  onInteraction?: (type: string) => void;
}

export function HologramAvatar({
  avatarState = 'idle',
  onInteraction,
}: HologramAvatarProps) {
  const [breathScale, setBreathScale] = useState(1);
  const [glowIntensity, setGlowIntensity] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const breathInterval = setInterval(() => {
      const time = Date.now() / 1000;
      setBreathScale(1 + Math.sin(time * 0.8) * 0.02);
      setGlowIntensity(0.8 + Math.sin(time * 1.2) * 0.2);
    }, 50);

    return () => clearInterval(breathInterval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const getStateStyles = () => {
    switch (avatarState) {
      case 'listening':
        return {
          borderColor: 'border-[#00f2ff]',
          glowColor: 'rgba(0, 242, 255, 0.6)',
          pulseSpeed: '1.5s',
        };
      case 'thinking':
        return {
          borderColor: 'border-[#ff00aa]',
          glowColor: 'rgba(255, 0, 170, 0.6)',
          pulseSpeed: '0.8s',
        };
      case 'speaking':
        return {
          borderColor: 'border-[#7c3aed]',
          glowColor: 'rgba(124, 58, 237, 0.6)',
          pulseSpeed: '0.5s',
        };
      default:
        return {
          borderColor: 'border-white/20',
          glowColor: 'rgba(0, 242, 255, 0.3)',
          pulseSpeed: '3s',
        };
    }
  };

  const stateStyles = getStateStyles();

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onClick={() => onInteraction?.('click')}
    >
      {/* Outer glow rings */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle, ${stateStyles.glowColor} 0%, transparent 70%)`,
          animation: `pulse ${stateStyles.pulseSpeed} ease-in-out infinite`,
          transform: `scale(${glowIntensity})`,
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(255, 0, 170, 0.4) 0%, transparent 60%)',
          animation: 'pulse 4s ease-in-out infinite reverse',
        }}
      />

      {/* Holographic prism effect */}
      <div className="absolute w-[320px] h-[320px]">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from ${mousePos.x * 360}deg, 
              rgba(0, 242, 255, 0.1), 
              rgba(255, 0, 170, 0.1), 
              rgba(124, 58, 237, 0.1), 
              rgba(0, 242, 255, 0.1))`,
            animation: 'spin 10s linear infinite',
          }}
        />
      </div>

      {/* Avatar container */}
      <div
        className={`relative w-72 h-72 rounded-full overflow-hidden border-2 ${stateStyles.borderColor} transition-all duration-500`}
        style={{
          transform: `scale(${breathScale}) perspective(1000px) rotateX(${(mousePos.y - 0.5) * 5}deg) rotateY(${(mousePos.x - 0.5) * 5}deg)`,
          boxShadow: `
            0 0 30px ${stateStyles.glowColor},
            0 0 60px ${stateStyles.glowColor.replace('0.6', '0.3')},
            inset 0 0 40px rgba(0, 242, 255, 0.1)
          `,
        }}
      >
        {/* Avatar gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c021a] via-[#1a0033] to-[#0c021a]" />
        
        {/* Holographic scan lines */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 242, 255, 0.1) 2px, rgba(0, 242, 255, 0.1) 4px)',
            animation: 'scanlines 8s linear infinite',
          }}
        />

        {/* Avatar silhouette/placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-48 h-48 text-[#00f2ff]/30"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            {/* Upper body silhouette */}
            <ellipse cx="50" cy="35" rx="18" ry="20" />
            <ellipse cx="50" cy="85" rx="30" ry="25" />
            {/* Glow effect on face area */}
            <ellipse
              cx="50"
              cy="35"
              rx="16"
              ry="18"
              fill="none"
              stroke="rgba(255, 0, 170, 0.3)"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Interactive highlight */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#00f2ff]"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              opacity: 0.4 + Math.random() * 0.4,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Status indicator */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <div className={`px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border ${
          avatarState === 'idle'
            ? 'bg-white/5 border-white/20 text-white/60'
            : avatarState === 'listening'
            ? 'bg-[#00f2ff]/10 border-[#00f2ff]/50 text-[#00f2ff]'
            : avatarState === 'thinking'
            ? 'bg-[#ff00aa]/10 border-[#ff00aa]/50 text-[#ff00aa]'
            : 'bg-[#7c3aed]/10 border-[#7c3aed]/50 text-[#7c3aed]'
        }`}>
          {avatarState === 'idle' ? 'Awaiting Command' :
           avatarState === 'listening' ? 'Listening...' :
           avatarState === 'thinking' ? 'Thinking...' : 'Speaking...'}
        </div>
      </div>
    </div>
  );
}

export default HologramAvatar;
