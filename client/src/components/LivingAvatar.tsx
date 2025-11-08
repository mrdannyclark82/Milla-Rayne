import React, { useState, useEffect, useRef, useCallback } from 'react';

export type AvatarState = 'neutral' | 'thinking' | 'responding' | 'listening';
export type EmotionType =
  | 'happy'
  | 'loving'
  | 'thoughtful'
  | 'excited'
  | 'calm'
  | 'playful';

interface LivingAvatarProps {
  avatarState?: AvatarState;
  emotion?: EmotionType;
  isSpeaking?: boolean;
  personalityMode?: string;
  onInteraction?: (type: string) => void;
}

interface EyeState {
  x: number;
  y: number;
  blink: boolean;
  size: number;
}

interface MouthState {
  shape: 'neutral' | 'smile' | 'open' | 'talking' | 'laugh';
  width: number;
  height: number;
}

interface FaceExpression {
  eyebrows: 'neutral' | 'raised' | 'furrowed' | 'surprised';
  cheeks: 'neutral' | 'blushed' | 'dimpled';
  overall: 'neutral' | 'happy' | 'focused' | 'loving';
}

export default function LivingAvatar({
  avatarState = 'neutral',
  emotion = 'loving',
  isSpeaking = false,
  personalityMode = 'loving',
  onInteraction,
}: LivingAvatarProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [eyeState, setEyeState] = useState<EyeState>({
    x: 0,
    y: 0,
    blink: false,
    size: 1,
  });
  const [mouthState, setMouthState] = useState<MouthState>({
    shape: 'neutral',
    width: 40,
    height: 20,
  });
  const [expression, setExpression] = useState<FaceExpression>({
    eyebrows: 'neutral',
    cheeks: 'neutral',
    overall: 'loving',
  });
  const [isHovered, setIsHovered] = useState(false);
  const [heartbeat, setHeartbeat] = useState(0);

  const avatarRef = useRef<HTMLDivElement>(null);
  const blinkIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const speechAnimationRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Mouse tracking for realistic eye movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!avatarRef.current) return;

    const rect = avatarRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.35; // Eyes are in upper portion

    // Calculate eye movement with realistic constraints
    const maxMovement = 8;
    const eyeX = Math.max(
      -maxMovement,
      Math.min(
        maxMovement,
        ((e.clientX - centerX) / rect.width) * maxMovement * 2
      )
    );
    const eyeY = Math.max(
      -maxMovement,
      Math.min(
        maxMovement,
        ((e.clientY - centerY) / rect.height) * maxMovement * 1.5
      )
    );

    setEyeState((prev) => ({ ...prev, x: eyeX, y: eyeY }));
  }, []);

  // Realistic blinking system
  useEffect(() => {
    const startBlinking = () => {
      const blink = () => {
        setEyeState((prev) => ({ ...prev, blink: true }));
        setTimeout(() => {
          setEyeState((prev) => ({ ...prev, blink: false }));
        }, 150);

        // Random blink interval (2-6 seconds)
        const nextBlink = Math.random() * 4000 + 2000;
        blinkIntervalRef.current = setTimeout(blink, nextBlink);
      };

      blinkIntervalRef.current = setTimeout(blink, 2000);
    };

    startBlinking();

    return () => {
      if (blinkIntervalRef.current) {
        clearTimeout(blinkIntervalRef.current);
      }
    };
  }, []);

  // Speech animation system
  useEffect(() => {
    if (isSpeaking) {
      const animateSpeech = () => {
        const shapes: MouthState['shape'][] = [
          'open',
          'talking',
          'smile',
          'open',
        ];
        let currentIndex = 0;

        const nextFrame = () => {
          setMouthState((prev) => ({
            ...prev,
            shape: shapes[currentIndex % shapes.length],
            width: 35 + Math.random() * 15,
            height: 15 + Math.random() * 10,
          }));

          currentIndex++;

          if (isSpeaking) {
            speechAnimationRef.current = setTimeout(
              nextFrame,
              100 + Math.random() * 100
            );
          }
        };

        nextFrame();
      };

      animateSpeech();
    } else {
      // Return to neutral when not speaking
      setMouthState((prev) => ({
        ...prev,
        shape: 'neutral',
        width: 40,
        height: 20,
      }));
    }

    return () => {
      if (speechAnimationRef.current) {
        clearTimeout(speechAnimationRef.current);
      }
    };
  }, [isSpeaking]);

  // Update expressions based on avatar state and emotion
  useEffect(() => {
    let newExpression: FaceExpression = {
      eyebrows: 'neutral',
      cheeks: 'neutral',
      overall: 'neutral',
    };

    // Base expression from emotion
    switch (emotion) {
      case 'happy':
        newExpression = {
          eyebrows: 'raised',
          cheeks: 'dimpled',
          overall: 'happy',
        };
        break;
      case 'loving':
        newExpression = {
          eyebrows: 'neutral',
          cheeks: 'blushed',
          overall: 'loving',
        };
        break;
      case 'thoughtful':
        newExpression = {
          eyebrows: 'furrowed',
          cheeks: 'neutral',
          overall: 'focused',
        };
        break;
      case 'excited':
        newExpression = {
          eyebrows: 'raised',
          cheeks: 'dimpled',
          overall: 'happy',
        };
        break;
      case 'playful':
        newExpression = {
          eyebrows: 'raised',
          cheeks: 'dimpled',
          overall: 'happy',
        };
        break;
    }

    // Modify based on avatar state
    switch (avatarState) {
      case 'thinking':
        newExpression.eyebrows = 'furrowed';
        newExpression.overall = 'focused';
        break;
      case 'responding':
        newExpression.eyebrows = 'raised';
        if (!isSpeaking) {
          setMouthState((prev) => ({ ...prev, shape: 'smile' }));
        }
        break;
      case 'listening':
        newExpression.eyebrows = 'raised';
        setEyeState((prev) => ({ ...prev, size: 1.1 })); // Slightly wider eyes when listening
        break;
    }

    setExpression(newExpression);
  }, [avatarState, emotion, isSpeaking]);

  // Heartbeat animation
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      setHeartbeat((prev) => (prev + 1) % 2);
    }, 800);

    return () => clearInterval(heartbeatInterval);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Get colors based on personality and state
  const getAvatarColors = () => {
    const baseHue =
      personalityMode === 'loving'
        ? 350
        : personalityMode === 'playful'
          ? 280
          : 220;

    return {
      skin: `hsl(${baseHue + 70}, 45%, 78%)`,
      hair: `hsl(${baseHue + 20}, 60%, 35%)`,
      eyes: emotion === 'loving' ? '#4FC3F7' : '#2E7D32',
      lips: `hsl(${baseHue}, 70%, 65%)`,
      blush: `hsl(${baseHue}, 60%, 75%)`,
    };
  };

  const colors = getAvatarColors();

  const handleFaceClick = (area: string) => {
    onInteraction?.(area);

    // Trigger appropriate reaction
    switch (area) {
      case 'eyes':
        setEyeState((prev) => ({ ...prev, blink: true }));
        setTimeout(
          () => setEyeState((prev) => ({ ...prev, blink: false })),
          150
        );
        break;
      case 'cheek':
        setExpression((prev) => ({ ...prev, cheeks: 'blushed' }));
        setTimeout(
          () => setExpression((prev) => ({ ...prev, cheeks: 'neutral' })),
          2000
        );
        break;
      case 'mouth':
        setMouthState((prev) => ({ ...prev, shape: 'smile' }));
        setTimeout(
          () => setMouthState((prev) => ({ ...prev, shape: 'neutral' })),
          1500
        );
        break;
    }
  };

  return (
    <div
      ref={avatarRef}
      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-100 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="living-avatar"
    >
      {/* Background ambient animation */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${colors.hair}20 0%, transparent 70%)`,
          animation: `gentle-pulse ${2000 + heartbeat * 100}ms ease-in-out infinite`,
        }}
      />

      {/* Main Avatar Container */}
      <div
        className="relative w-80 h-80 transition-all duration-500"
        style={{
          transform: `scale(${isHovered ? 1.05 : 1}) ${avatarState === 'responding' ? 'translateY(-5px)' : ''}`,
          filter:
            avatarState === 'thinking' ? 'saturate(0.8)' : 'saturate(1.1)',
        }}
      >
        {/* Head/Face Base */}
        <div
          className="absolute w-60 h-72 rounded-full mx-auto left-1/2 transform -translate-x-1/2"
          style={{
            background: `linear-gradient(145deg, ${colors.skin}, ${colors.skin}cc)`,
            boxShadow: isHovered
              ? `0 20px 40px ${colors.skin}40`
              : `0 10px 30px ${colors.skin}30`,
          }}
        >
          {/* Hair */}
          <div
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-56 h-32 rounded-t-full"
            style={{
              background: `linear-gradient(135deg, ${colors.hair}, ${colors.hair}dd)`,
              clipPath: 'ellipse(80% 100% at 50% 100%)',
            }}
          />

          {/* Eyebrows */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex space-x-8">
            <div
              className={`w-8 h-2 rounded-full transition-all duration-300 ${
                expression.eyebrows === 'raised'
                  ? 'transform -translate-y-1'
                  : expression.eyebrows === 'furrowed'
                    ? 'transform translate-y-1'
                    : expression.eyebrows === 'surprised'
                      ? 'transform -translate-y-2'
                      : ''
              }`}
              style={{ background: colors.hair }}
            />
            <div
              className={`w-8 h-2 rounded-full transition-all duration-300 ${
                expression.eyebrows === 'raised'
                  ? 'transform -translate-y-1'
                  : expression.eyebrows === 'furrowed'
                    ? 'transform translate-y-1'
                    : expression.eyebrows === 'surprised'
                      ? 'transform -translate-y-2'
                      : ''
              }`}
              style={{ background: colors.hair }}
            />
          </div>

          {/* Eyes */}
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 flex space-x-6">
            {/* Left Eye */}
            <div
              className={`relative w-8 h-6 bg-white rounded-full cursor-pointer transition-all duration-200 ${
                eyeState.blink ? 'h-1' : ''
              }`}
              style={{
                transform: `translate(${eyeState.x * 0.3}px, ${eyeState.y * 0.3}px) scale(${eyeState.size})`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              onClick={() => handleFaceClick('eyes')}
            >
              <div
                className="absolute top-1 left-2 w-4 h-4 rounded-full transition-all duration-100"
                style={{
                  background: colors.eyes,
                  transform: `translate(${eyeState.x * 0.5}px, ${eyeState.y * 0.5}px)`,
                }}
              >
                <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full">
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-80" />
                </div>
              </div>
            </div>

            {/* Right Eye */}
            <div
              className={`relative w-8 h-6 bg-white rounded-full cursor-pointer transition-all duration-200 ${
                eyeState.blink ? 'h-1' : ''
              }`}
              style={{
                transform: `translate(${eyeState.x * 0.3}px, ${eyeState.y * 0.3}px) scale(${eyeState.size})`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              onClick={() => handleFaceClick('eyes')}
            >
              <div
                className="absolute top-1 left-2 w-4 h-4 rounded-full transition-all duration-100"
                style={{
                  background: colors.eyes,
                  transform: `translate(${eyeState.x * 0.5}px, ${eyeState.y * 0.5}px)`,
                }}
              >
                <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full">
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-80" />
                </div>
              </div>
            </div>
          </div>

          {/* Nose */}
          <div
            className="absolute top-28 left-1/2 transform -translate-x-1/2 w-3 h-4 rounded-full opacity-20"
            style={{ background: colors.hair }}
          />

          {/* Cheeks (blush) */}
          {expression.cheeks === 'blushed' && (
            <>
              <div
                className="absolute top-24 left-8 w-6 h-4 rounded-full opacity-40 animate-pulse"
                style={{ background: colors.blush }}
                onClick={() => handleFaceClick('cheek')}
              />
              <div
                className="absolute top-24 right-8 w-6 h-4 rounded-full opacity-40 animate-pulse"
                style={{ background: colors.blush }}
                onClick={() => handleFaceClick('cheek')}
              />
            </>
          )}

          {/* Mouth */}
          <div
            className={`absolute top-36 left-1/2 transform -translate-x-1/2 cursor-pointer transition-all duration-200 ${
              mouthState.shape === 'smile' || expression.overall === 'happy'
                ? 'rounded-b-full'
                : mouthState.shape === 'open' || mouthState.shape === 'talking'
                  ? 'rounded-full'
                  : mouthState.shape === 'laugh'
                    ? 'rounded-full'
                    : 'rounded-full'
            }`}
            style={{
              width: `${mouthState.width}px`,
              height: `${mouthState.shape === 'smile' ? mouthState.height * 0.5 : mouthState.height}px`,
              background:
                mouthState.shape === 'open' ||
                mouthState.shape === 'talking' ||
                mouthState.shape === 'laugh'
                  ? '#2D1B2E'
                  : colors.lips,
              transform: `translateX(-50%) ${mouthState.shape === 'smile' ? 'rotate(0deg)' : 'rotate(0deg)'}`,
              boxShadow:
                mouthState.shape === 'smile' || expression.overall === 'happy'
                  ? `0 4px 8px ${colors.lips}40`
                  : 'none',
            }}
            onClick={() => handleFaceClick('mouth')}
          >
            {/* Teeth (when mouth is open) */}
            {(mouthState.shape === 'open' ||
              mouthState.shape === 'talking') && (
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-white rounded-sm opacity-90" />
            )}
          </div>
        </div>

        {/* Conversation State Indicator */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-500 ${
              avatarState === 'thinking'
                ? 'bg-blue-100 text-blue-800 animate-pulse'
                : avatarState === 'responding'
                  ? 'bg-green-100 text-green-800 animate-bounce'
                  : avatarState === 'listening'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-purple-100 text-purple-800'
            }`}
          >
            {avatarState === 'thinking'
              ? '💭 Thinking...'
              : avatarState === 'responding'
                ? `💬 ${isSpeaking ? 'Speaking...' : 'Ready to speak'}`
                : avatarState === 'listening'
                  ? '👂 Listening...'
                  : '😌 Present'}
          </div>
        </div>

        {/* Interaction Hints */}
        {isHovered && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-full">
            <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg text-center backdrop-blur-sm">
              Click my eyes, cheeks, or mouth! 💕
            </div>
          </div>
        )}
      </div>

      {/* Ambient particles for emotion */}
      {(emotion === 'loving' || emotion === 'happy') && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-pink-300 rounded-full opacity-60 animate-bounce"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: `${2000 + i * 300}ms`,
              }}
            >
              💕
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
