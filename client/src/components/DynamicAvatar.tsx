import React, { useMemo, useRef, useLayoutEffect, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Box3, Vector3, Group, Object3D } from 'three';
import { outfitPalettes } from '@/config/millaAppearance';

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

// Helper functions for scaling the 3D GLB model to fit the container
function fitOnFloor(root: Object3D, targetHeight = 1.68) {
  const box = new Box3().setFromObject(root);
  const size = new Vector3();
  box.getSize(size);
  const h = Math.max(size.y, 0.001);
  root.scale.setScalar(targetHeight / h);
  const fitted = new Box3().setFromObject(root);
  const center = new Vector3();
  fitted.getCenter(center);
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= fitted.min.y;
}

// Immersive 3D GLB model renderer component
function GltfMillaModel({
  url,
  height,
  wardrobeColor,
}: {
  url: string;
  height: number;
  wardrobeColor?: { primary: string; secondary: string };
}) {
  const gltf = useLoader(GLTFLoader, url);
  const wrap = useRef<Group>(null);

  useLayoutEffect(() => {
    if (!wrap.current) return;
    wrap.current.clear();
    const scene = gltf.scene.clone(true);
    
    scene.traverse((obj) => {
      const mesh = obj as any;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Dynamically set clothes material colors!
        if (wardrobeColor && mesh.material) {
          const name = (mesh.name || '').toLowerCase();
          if (
            name.includes('cloth') ||
            name.includes('dress') ||
            name.includes('shirt') ||
            name.includes('outfit') ||
            name.includes('wear') ||
            name.includes('torso') ||
            name.includes('skirt')
          ) {
            if (mesh.material.color) {
              mesh.material.color.set(wardrobeColor.primary);
            }
          } else if (
            name.includes('collar') ||
            name.includes('trim') ||
            name.includes('sleeve') ||
            name.includes('accent') ||
            name.includes('arm')
          ) {
            if (mesh.material.color) {
              mesh.material.color.set(wardrobeColor.secondary);
            }
          }
        }
      }
    });
    
    wrap.current.add(scene);
    fitOnFloor(wrap.current, height);
  }, [gltf, url, height, wardrobeColor]);

  // Slow idle orbit rotation and breathing
  useFrame((state) => {
    if (!wrap.current) return;
    const time = state.clock.getElapsedTime();
    wrap.current.rotation.y = Math.sin(time * 0.15) * 0.12; // Gentle sway
    wrap.current.position.y = Math.sin(time * 1.2) * 0.01;  // Breathing bob
  });

  return <group ref={wrap} />;
}

const getBackgroundStyle = (background: string) => {
  switch (background) {
    case 'gradient':
      return 'linear-gradient(135deg, #120428 0%, #1a0033 100%)';
    case 'nature':
      return 'linear-gradient(135deg, #093028 0%, #237a57 100%)';
    case 'abstract':
      return 'linear-gradient(135deg, #4c0519 0%, #1e1b4b 100%)';
    default:
      return '#0c021a';
  }
};

const getFilterStyle = (
  lighting: number,
  glow: number,
  avatarState: string
) => {
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

export const DynamicAvatar = React.memo<DynamicAvatarProps>(
  ({ avatarState, settings, useVideo = false, fallbackImage }) => {
    // Memoize expensive style calculations
    const avatarStyles = useMemo(
      () => ({
        background: getBackgroundStyle(settings.background),
        filter: getFilterStyle(settings.lighting, settings.glow, avatarState),
        transform: getTransformStyle(avatarState),
        animation: getAnimationStyle(settings.expression),
      }),
      [
        avatarState,
        settings.background,
        settings.lighting,
        settings.glow,
        settings.expression,
      ]
    );

    // Get dynamic outfit palette colors
    const currentOutfitColors = useMemo(() => {
      return outfitPalettes[settings.outfit] || outfitPalettes.casual;
    }, [settings.outfit]);

    // Map style types to individual copied 3D GLB models
    const modelUrl = useMemo(() => {
      switch (settings.style) {
        case 'anime':
          return '/models/milla-meshy.glb';
        case 'artistic':
          return '/models/milla-bust.glb';
        case 'minimal':
          return '/models/milla-triposr.glb';
        default:
          return '/models/milla-body.glb';
      }
    }, [settings.style]);

    const modelHeight = useMemo(() => {
      switch (settings.style) {
        case 'artistic':
          return 1.1;
        case 'anime':
          return 1.4;
        default:
          return 1.68;
      }
    }, [settings.style]);

    // Generate a 3D WebGL Canvas loaded with the chosen model
    const renderGeneratedAvatar = useMemo(
      () => (
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
          {/* Background */}
          <div
            className="absolute inset-0"
            style={{ background: avatarStyles.background }}
          />

          {/* Interactive 3D WebGL Scene */}
          <div className="relative z-10 w-full h-[calc(100%-80px)]" style={{ pointerEvents: 'auto' }}>
            <Suspense fallback={
              <div className="absolute inset-0 flex flex-col items-center justify-center text-cyan-400 text-xs gap-3">
                <span className="h-6 w-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                Initializing 3D Core...
              </div>
            }>
              <Canvas
                camera={{ position: [0, 1.1, 2.3], fov: 42 }}
                gl={{ antialias: true, alpha: true }}
              >
                <ambientLight intensity={1.4} />
                <directionalLight position={[5, 10, 5]} intensity={1.8} castShadow />
                <directionalLight position={[-5, 5, -5]} intensity={0.6} />
                <pointLight position={[0, 2, 2]} intensity={1.0} />
                <GltfMillaModel
                  url={modelUrl}
                  height={modelHeight}
                  wardrobeColor={currentOutfitColors}
                />
              </Canvas>
            </Suspense>
          </div>

          {/* Name and style info */}
          <div className="relative z-20 text-white/80 pb-6 text-center select-none">
            <h3 className="text-lg font-semibold tracking-wide">Milla Rayne</h3>
            <p className="text-xs opacity-70 capitalize mt-0.5">
              {settings.style} • {settings.expression}
            </p>
            <p className="text-[10px] font-medium opacity-60 uppercase tracking-wider mt-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full inline-block">
              {settings.outfit} wardrobe
            </p>
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
      ),
      [
        avatarStyles.background,
        modelUrl,
        modelHeight,
        currentOutfitColors,
        settings.style,
        settings.expression,
        settings.outfit,
        settings.glow,
      ]
    );

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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.avatarState === nextProps.avatarState &&
      prevProps.useVideo === nextProps.useVideo &&
      prevProps.fallbackImage === nextProps.fallbackImage &&
      prevProps.settings.background === nextProps.settings.background &&
      prevProps.settings.lighting === nextProps.settings.lighting &&
      prevProps.settings.glow === nextProps.settings.glow &&
      prevProps.settings.expression === nextProps.settings.expression &&
      prevProps.settings.style === nextProps.settings.style &&
      prevProps.settings.outfit === nextProps.settings.outfit
    );
  }
);

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
