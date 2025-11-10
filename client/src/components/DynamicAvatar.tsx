import React, { useMemo } from 'react';

interface AvatarSettings {
  style: 'realistic' | 'anime' | 'artistic' | 'minimal';
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  outfit: 'casual' | 'elegant' | 'professional' | 'intimate';
  expression: 'loving' | 'playful' | 'mysterious' | 'gentle';
  background: 'gradient' | 'solid' | 'nature' | 'abstract';
  lighting: number; // 0-100
  glow: number; // 0-100
}

interface DynamicAvatarProps {
  avatarState: 'neutral' | 'thinking' | 'responding' | 'listening';
  settings: AvatarSettings;
  useVideo?: boolean;
  fallbackImage?: string;
}

// Helper functions moved outside component to avoid recreation
const getBackgroundStyle = (background: string) => {
  switch (background) {
    case 'gradient':
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    case 'nature':
      return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    case 'abstract':
      return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    default:
      return '#1a1a2e';
  }
};

const getFilterStyle = (lighting: number, glow: number, avatarState: string) => {
  const brightness = (lighting / 100) * 1.5 + 0.5; // 0.5 to 2.0
  const glowValue = glow / 100;

  let filter = `brightness(${brightness}) saturate(1.2)`;

  // Add state-based filters
  switch (avatarState) {
    case 'thinking':
      filter += ' hue-rotate(240deg) contrast(1.1)';
      break;
    case 'responding':
      filter += ' hue-rotate(120deg) contrast(1.2)';
      break;
    case 'listening':
      filter += ' hue-rotate(60deg) contrast(1.1)';
      break;
  }

  if (glowValue > 0.3) {
    filter += ` drop-shadow(0 0 ${glowValue * 20}px rgba(255, 255, 255, ${glowValue * 0.3}))`;
  }

  return filter;
};

const getTransformStyle = (avatarState: string) => {
  switch (avatarState) {
    case 'thinking':
      return 'scale(1.02) rotate(-0.5deg)';
    case 'responding':
      return 'scale(1.05) rotate(0.5deg)';
    case 'listening':
      return 'scale(1.03)';
    default:
      return 'scale(1)';
  }
};

const getAnimationStyle = (expression: string) => {
  const baseAnimation = 'gentle-breathing 4s ease-in-out infinite';

  switch (expression) {
    case 'playful':
      return `${baseAnimation}, playful-bounce 6s ease-in-out infinite`;
    case 'mysterious':
      return `${baseAnimation}, mysterious-sway 8s ease-in-out infinite`;
    case 'gentle':
      return `${baseAnimation}, gentle-glow 5s ease-in-out infinite`;
    default:
      return baseAnimation;
  }
};

export const DynamicAvatar = React.memo<DynamicAvatarProps>(({
  avatarState,
  settings,
  useVideo = false,
  fallbackImage,
}) => {
  // Memoize expensive style calculations
  const avatarStyles = useMemo(() => ({
    background: getBackgroundStyle(settings.background),
    filter: getFilterStyle(settings.lighting, settings.glow, avatarState),
    transform: getTransformStyle(avatarState),
    animation: getAnimationStyle(settings.expression),
  }), [avatarState, settings.background, settings.lighting, settings.glow, settings.expression]);

  // Memoize skin tone gradient
  const skinToneGradient = useMemo(() => 
    `radial-gradient(circle, ${
      settings.skinTone === 'fair' ? '#f4c2a1' : 
      settings.skinTone === 'medium' ? '#deb887' : '#8d5524'
    } 0%, rgba(255,255,255,0.1) 100%)`
  , [settings.skinTone]);

  // Memoize eye color
  const eyeColor = useMemo(() => {
    switch (settings.eyeColor) {
      case 'blue': return '#4169e1';
      case 'green': return '#228b22';
      default: return '#8b4513';
    }
  }, [settings.eyeColor]);

  // Memoize hair color
  const hairColor = useMemo(() => {
    switch (settings.hairColor) {
      case 'blonde': return '#ffd700';
      case 'brunette': return '#8b4513';
      case 'auburn': return '#a52a2a';
      default: return '#2f2f2f';
    }
  }, [settings.hairColor]);

  // Generate a CSS-based avatar when no image/video is available
  const renderGeneratedAvatar = useMemo(() => (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: avatarStyles.background }}
      />

      {/* Avatar representation */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-8">
        {/* Face area */}
        <div
          className="w-32 h-32 rounded-full mb-6 border-4 border-white/20 flex items-center justify-center"
          style={{ background: skinToneGradient }}
        >
          {/* Eyes */}
          <div className="flex space-x-4">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eyeColor }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eyeColor }} />
          </div>
        </div>

        {/* Hair representation */}
        <div
          className="absolute top-4 w-36 h-20 rounded-t-full"
          style={{ backgroundColor: hairColor }}
        />

        {/* Name and style info */}
        <div className="text-white/80 mt-8">
          <h3 className="text-xl font-semibold mb-2">Milla Rayne</h3>
          <p className="text-sm opacity-70 capitalize">
            {settings.style} • {settings.expression}
          </p>
          <p className="text-xs opacity-60 mt-1">{settings.outfit} attire</p>
        </div>
      </div>

      {/* Glow overlay */}
      {settings.glow > 30 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, rgba(255,255,255,${settings.glow / 200}) 0%, transparent 70%)`,
            animation: 'pulse 3s ease-in-out infinite',
          }}
        />
      )}
    </div>
  ), [avatarStyles.background, skinToneGradient, eyeColor, hairColor, settings.style, settings.expression, settings.outfit, settings.glow]);

  return (
    <div
      className="w-full h-full relative transition-all duration-1000 ease-in-out"
      style={avatarStyles}
      data-testid="dynamic-avatar"
    >
      {useVideo && fallbackImage ? (
        <img
          src={fallbackImage}
          alt="Milla AI Assistant"
          className="w-full h-full object-cover"
          style={avatarStyles}
        />
      ) : (
        renderGeneratedAvatar
      )}

      {/* State indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            avatarState === 'thinking'
              ? 'bg-blue-500/20 text-blue-300'
              : avatarState === 'responding'
                ? 'bg-green-500/20 text-green-300'
                : avatarState === 'listening'
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-purple-500/20 text-purple-300'
          }`}
        >
          {avatarState}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these actually changed
  return (
    prevProps.avatarState === nextProps.avatarState &&
    prevProps.useVideo === nextProps.useVideo &&
    prevProps.fallbackImage === nextProps.fallbackImage &&
    prevProps.settings.background === nextProps.settings.background &&
    prevProps.settings.lighting === nextProps.settings.lighting &&
    prevProps.settings.glow === nextProps.settings.glow &&
    prevProps.settings.expression === nextProps.settings.expression &&
    prevProps.settings.style === nextProps.settings.style &&
    prevProps.settings.hairColor === nextProps.settings.hairColor &&
    prevProps.settings.eyeColor === nextProps.settings.eyeColor &&
    prevProps.settings.skinTone === nextProps.settings.skinTone &&
    prevProps.settings.outfit === nextProps.settings.outfit
  );
});

// CSS animations to add to the global styles
export const avatarAnimations = `
  @keyframes gentle-breathing {
    0%, 100% { transform: scale(1) translateY(0px); }
    50% { transform: scale(1.02) translateY(-2px); }
  }
  
  @keyframes playful-bounce {
    0%, 100% { transform: translateY(0px); }
    25% { transform: translateY(-3px); }
    75% { transform: translateY(-1px); }
  }
  
  @keyframes mysterious-sway {
    0%, 100% { transform: translateX(0px) rotate(0deg); }
    33% { transform: translateX(2px) rotate(0.5deg); }
    66% { transform: translateX(-2px) rotate(-0.5deg); }
  }
  
  @keyframes gentle-glow {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.1); }
  }
`;
