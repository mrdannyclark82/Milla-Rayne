import React, { useState, useEffect, useRef, useCallback } from 'react';
import millaRealistic from "@assets/generated_images/Hyper-realistic_Milla_full_body_dbd5d6ca.png";

export type AvatarState = "neutral" | "thinking" | "responding" | "listening";
export type GestureType = "wave" | "nod" | "smile" | "wink" | "heart" | "surprised" | "shy";

interface InteractiveAvatarProps {
  avatarState?: AvatarState;
  onGesture?: (gesture: GestureType) => void;
  personalityMode?: string;
}

interface MousePosition {
  x: number;
  y: number;
}

interface AvatarInteraction {
  type: GestureType;
  message: string;
  duration: number;
}

export default function InteractiveAvatar({ 
  avatarState = "neutral", 
  onGesture,
  personalityMode = "loving"
}: InteractiveAvatarProps) {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [eyePosition, setEyePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [currentGesture, setCurrentGesture] = useState<AvatarInteraction | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const avatarRef = useRef<HTMLDivElement>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout>();

  // Mouse tracking for eye movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!avatarRef.current) return;
    
    const rect = avatarRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3; // Eyes are in upper third
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Calculate eye movement range (limited to realistic movement)
    const maxEyeMovement = 15;
    const eyeX = Math.max(-maxEyeMovement, Math.min(maxEyeMovement, 
      (mouseX - centerX) / (rect.width / 2) * maxEyeMovement));
    const eyeY = Math.max(-maxEyeMovement, Math.min(maxEyeMovement,
      (mouseY - centerY) / (rect.height / 3) * maxEyeMovement));
    
    setMousePosition({ x: mouseX, y: mouseY });
    setEyePosition({ x: eyeX, y: eyeY });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Gesture system
  const triggerGesture = useCallback((gesture: GestureType, message: string, duration: number = 3000) => {
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
    }
    
    const interaction: AvatarInteraction = { type: gesture, message, duration };
    setCurrentGesture(interaction);
    onGesture?.(gesture);
    
    gestureTimeoutRef.current = setTimeout(() => {
      setCurrentGesture(null);
    }, duration);
  }, [onGesture]);

  // Click interactions based on area
  const handleAvatarClick = (e: React.MouseEvent) => {
    if (!avatarRef.current) return;
    
    const rect = avatarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const relativeX = clickX / rect.width;
    const relativeY = clickY / rect.height;
    
    setClickCount(prev => prev + 1);
    
    // Different reactions based on click area
    if (relativeY < 0.3) {
      // Head area - face interactions
      if (relativeX > 0.4 && relativeX < 0.6 && relativeY > 0.15 && relativeY < 0.25) {
        // Eyes area
        triggerGesture("wink", "😉 Caught you looking!", 2000);
      } else {
        // General head area
        triggerGesture("smile", "💕 You're so sweet!", 2500);
      }
    } else if (relativeY < 0.7) {
      // Body area - friendly gestures
      if (clickCount % 3 === 0) {
        triggerGesture("heart", "💖 I love spending time with you!", 3000);
      } else {
        triggerGesture("wave", "👋 Hey there, handsome!", 2000);
      }
    } else {
      // Lower area - playful responses
      triggerGesture("shy", "☺️ You're making me blush...", 2500);
    }
  };

  // Hover interactions
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!currentGesture && Math.random() > 0.7) {
      const greetings = [
        { gesture: "smile" as GestureType, message: "😊 Hi beautiful!" },
        { gesture: "wave" as GestureType, message: "👋 Looking at me?" },
        { gesture: "heart" as GestureType, message: "💕 I missed you!" }
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      triggerGesture(greeting.gesture, greeting.message, 1500);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Context-aware gestures based on avatar state
  useEffect(() => {
    if (!currentGesture) {
      switch (avatarState) {
        case 'thinking':
          if (Math.random() > 0.8) {
            triggerGesture("nod", "🤔 Let me think about that...", 2000);
          }
          break;
        case 'responding':
          if (Math.random() > 0.9) {
            triggerGesture("smile", "✨ I have something to say!", 1500);
          }
          break;
        case 'listening':
          if (Math.random() > 0.85) {
            triggerGesture("nod", "👂 I'm listening carefully...", 1800);
          }
          break;
      }
    }
  }, [avatarState, currentGesture, triggerGesture]);

  // Get gesture-specific styles and animations
  const getGestureStyles = () => {
    if (!currentGesture) return {};
    
    switch (currentGesture.type) {
      case 'wave':
        return { animation: 'wave-gesture 1s ease-in-out' };
      case 'nod':
        return { animation: 'nod-gesture 0.8s ease-in-out' };
      case 'smile':
        return { filter: 'brightness(1.1) saturate(1.2)' };
      case 'wink':
        return { animation: 'wink-gesture 0.5s ease-in-out' };
      case 'heart':
        return { 
          filter: 'hue-rotate(300deg) saturate(1.4) brightness(1.1)',
          animation: 'heart-pulse 1.5s ease-in-out'
        };
      case 'surprised':
        return { 
          transform: 'scale(1.05)',
          animation: 'surprised-bounce 0.6s ease-out'
        };
      case 'shy':
        return { 
          filter: 'hue-rotate(15deg) brightness(1.05)',
          animation: 'shy-sway 1.2s ease-in-out'
        };
      default:
        return {};
    }
  };

  const getAvatarClasses = () => {
    let classes = "w-full h-full object-cover object-center transition-all duration-500 ease-in-out cursor-pointer";
    
    if (isHovered) {
      classes += " scale-[1.02] brightness-110";
    }
    
    switch (avatarState) {
      case 'thinking':
        classes += " hue-rotate-[240deg] contrast-110";
        break;
      case 'responding':
        classes += " hue-rotate-[120deg] contrast-120 brightness-105";
        break;
      case 'listening':
        classes += " hue-rotate-[60deg] contrast-110";
        break;
    }
    
    return classes;
  };

  return (
    <div className="w-full h-full relative">
      {/* Main Avatar Container */}
      <aside 
        ref={avatarRef}
        className="w-full h-full bg-background flex flex-col relative overflow-hidden"
        data-testid="interactive-avatar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Avatar Image with Eye Tracking Effect */}
        <div className="w-full h-full relative">
          <img 
            src={millaRealistic} 
            alt="Milla - Interactive AI Assistant" 
            className={getAvatarClasses()}
            style={{
              ...getGestureStyles(),
              transform: `${getGestureStyles().transform || ''} translate(${eyePosition.x * 0.3}px, ${eyePosition.y * 0.3}px)`
            }}
            onClick={handleAvatarClick}
          />
          
          {/* Eye Tracking Indicators (subtle) */}
          <div 
            className="absolute w-2 h-2 bg-white/20 rounded-full transition-all duration-150 pointer-events-none"
            style={{
              left: `${45 + eyePosition.x * 0.5}%`,
              top: `${22 + eyePosition.y * 0.3}%`,
              opacity: isHovered ? 0.6 : 0.3
            }}
          />
          <div 
            className="absolute w-2 h-2 bg-white/20 rounded-full transition-all duration-150 pointer-events-none"
            style={{
              left: `${55 + eyePosition.x * 0.5}%`,
              top: `${22 + eyePosition.y * 0.3}%`,
              opacity: isHovered ? 0.6 : 0.3
            }}
          />
        </div>

        {/* Gesture Message Overlay */}
        {currentGesture && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white/90 text-sm font-medium text-center animate-fade-in border border-white/20">
              {currentGesture.message}
            </div>
          </div>
        )}

        {/* Interactive Zones Hint (only visible on hover) */}
        {isHovered && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Face interaction zone */}
            <div className="absolute top-[15%] left-[35%] w-[30%] h-[15%] border-2 border-white/20 rounded-full animate-pulse opacity-30" />
            {/* Heart/body zone */}
            <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] border-2 border-pink-400/30 rounded-full animate-pulse opacity-20" />
          </div>
        )}

        {/* Conversation State Indicator */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            avatarState === 'thinking' ? 'bg-blue-500/20 text-blue-300 animate-pulse' :
            avatarState === 'responding' ? 'bg-green-500/20 text-green-300 animate-bounce' :
            avatarState === 'listening' ? 'bg-yellow-500/20 text-yellow-300 animate-ping' :
            'bg-purple-500/20 text-purple-300'
          }`}>
            {avatarState === 'thinking' ? '💭 Thinking...' :
             avatarState === 'responding' ? '💬 Speaking...' :
             avatarState === 'listening' ? '👂 Listening...' :
             '😌 Relaxed'}
          </div>
        </div>

        {/* Interaction Counter (for debugging/fun) */}
        {clickCount > 0 && (
          <div className="absolute top-4 right-4 z-15">
            <div className="bg-pink-500/20 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-pink-300 text-xs font-bold animate-bounce">
              {clickCount > 99 ? '💕' : clickCount}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

// CSS animations for gestures - these should be added to the global CSS
export const interactiveAvatarAnimations = `
  @keyframes wave-gesture {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(5deg); }
    75% { transform: rotate(-5deg); }
  }
  
  @keyframes nod-gesture {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  
  @keyframes wink-gesture {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.8); }
  }
  
  @keyframes heart-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes surprised-bounce {
    0% { transform: scale(1); }
    30% { transform: scale(1.08); }
    100% { transform: scale(1.02); }
  }
  
  @keyframes shy-sway {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-1deg); }
    75% { transform: rotate(1deg); }
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;