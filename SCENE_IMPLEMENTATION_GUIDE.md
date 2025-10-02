# Adaptive Interactive Scene Generation - Implementation Guide

## Quick Start

This guide provides actionable steps and code examples for implementing the adaptive scene generation feature.

---

## Option Comparison Summary

| Feature | Option 1: CSS Only | Option 2: WebGL Only | Option 3: Hybrid ⭐ |
|---------|-------------------|---------------------|-------------------|
| **Performance** | Excellent (60fps+) | Variable (30-60fps) | Excellent with fallback |
| **Visual Quality** | Good | Excellent | Best of both |
| **Device Support** | 100% | ~95% (WebGL required) | 100% |
| **Implementation Time** | 2-3 days | 5-7 days | 4-6 days |
| **Maintenance** | Low | Medium | Medium |
| **Bundle Size** | +15KB | +150KB | +50KB (lazy load) |
| **Accessibility** | Excellent | Good | Excellent |
| **Future-Proof** | Limited | Limited | Highly extensible |
| **Risk Level** | Low | Medium-High | Medium |

**Recommendation**: **Option 3 (Hybrid)** - Best balance of quality, performance, and compatibility.

---

## Implementation Steps (Hybrid Approach)

### Step 1: Create Base Types and Utilities

Create `client/src/types/scene.ts`:
```typescript
export type SceneMood = 'calm' | 'energetic' | 'romantic' | 'mysterious' | 'playful';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type AvatarState = 'neutral' | 'thinking' | 'responding' | 'listening';
export type ParticleType = 'stars' | 'sparkles' | 'hearts' | 'petals' | 'mist';

export interface SceneContext {
  mood: SceneMood;
  timeOfDay: TimeOfDay;
  avatarState: AvatarState;
  isActive: boolean;
}

export interface DeviceCapabilities {
  webGL: boolean;
  gpuTier: 'low' | 'medium' | 'high';
  prefersReducedMotion: boolean;
  screenSize: { width: number; height: number };
}

export interface SceneConfig {
  colors: string[];
  animations: string[];
  particles?: ParticleConfig;
  interactive: boolean;
}

export interface ParticleConfig {
  type: ParticleType;
  density: 'low' | 'medium' | 'high';
  speed: number;
}
```

Create `client/src/utils/capabilityDetector.ts`:
```typescript
import { DeviceCapabilities } from '@/types/scene';

export function detectDeviceCapabilities(): DeviceCapabilities {
  // Check WebGL support
  const canvas = document.createElement('canvas');
  const webGL = !!(
    canvas.getContext('webgl') || 
    canvas.getContext('experimental-webgl')
  );

  // Detect reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Get screen size
  const screenSize = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  // Simple GPU tier detection (can be enhanced)
  let gpuTier: 'low' | 'medium' | 'high' = 'medium';
  if (screenSize.width < 768 || !webGL) {
    gpuTier = 'low';
  } else if (screenSize.width > 1920 && webGL) {
    gpuTier = 'high';
  }

  return {
    webGL,
    gpuTier,
    prefersReducedMotion,
    screenSize
  };
}
```

---

### Step 2: Create Scene Configuration Presets

Create `client/src/utils/scenePresets.ts`:
```typescript
import { SceneConfig, SceneMood, TimeOfDay } from '@/types/scene';

export const TIME_BASED_SCENES: Record<TimeOfDay, SceneConfig> = {
  dawn: {
    colors: ['#FF6B9D', '#FFA07A', '#FFD700', '#87CEEB'],
    animations: ['gentle-wave', 'fade-in-out'],
    particles: { type: 'stars', density: 'low', speed: 0.5 },
    interactive: true
  },
  day: {
    colors: ['#87CEEB', '#B0E0E6', '#ADD8E6', '#E0F6FF'],
    animations: ['breathing', 'shimmer'],
    particles: { type: 'sparkles', density: 'medium', speed: 1.0 },
    interactive: true
  },
  dusk: {
    colors: ['#FF6B6B', '#FF8E53', '#FE6B8B', '#C471ED'],
    animations: ['slow-rotate', 'glow-pulse'],
    particles: { type: 'sparkles', density: 'high', speed: 0.8 },
    interactive: true
  },
  night: {
    colors: ['#0F2027', '#203A43', '#2C5364', '#1A1A2E'],
    animations: ['twinkle', 'drift'],
    particles: { type: 'stars', density: 'high', speed: 0.3 },
    interactive: true
  }
};

export const MOOD_BASED_SCENES: Record<SceneMood, Partial<SceneConfig>> = {
  calm: {
    colors: ['#667eea', '#764ba2', '#89CFF0', '#A8D8EA'],
    animations: ['gentle-wave', 'breathing'],
  },
  energetic: {
    colors: ['#f093fb', '#f5576c', '#FF6B9D', '#FEC163'],
    animations: ['pulse', 'bounce'],
  },
  romantic: {
    colors: ['#FE6B8B', '#FF8E53', '#FFAFBD', '#FFC3A0'],
    animations: ['breathing', 'glow-pulse'],
    particles: { type: 'hearts', density: 'low', speed: 0.6 }
  },
  mysterious: {
    colors: ['#2E3440', '#3B4252', '#434C5E', '#4C566A'],
    animations: ['mist', 'slow-rotate'],
    particles: { type: 'mist', density: 'medium', speed: 0.4 }
  },
  playful: {
    colors: ['#FF6B9D', '#C471ED', '#12c2e9', '#f64f59'],
    animations: ['bounce', 'wiggle'],
    particles: { type: 'sparkles', density: 'high', speed: 1.2 }
  }
};

export function getSceneForContext(
  timeOfDay: TimeOfDay,
  mood: SceneMood
): SceneConfig {
  const timeScene = TIME_BASED_SCENES[timeOfDay];
  const moodScene = MOOD_BASED_SCENES[mood];

  // Merge configurations, prioritizing mood-specific settings
  return {
    colors: moodScene.colors || timeScene.colors,
    animations: [...(timeScene.animations || []), ...(moodScene.animations || [])],
    particles: moodScene.particles || timeScene.particles,
    interactive: timeScene.interactive
  };
}

export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}
```

---

### Step 3: Create CSS Scene Renderer Component

Create `client/src/components/scene/CSSSceneRenderer.tsx`:
```typescript
import React, { useEffect, useState, useRef } from 'react';
import { SceneConfig } from '@/types/scene';

interface CSSSceneRendererProps {
  config: SceneConfig;
  interactive?: boolean;
  parallaxIntensity?: number;
}

export const CSSSceneRenderer: React.FC<CSSSceneRendererProps> = ({
  config,
  interactive = true,
  parallaxIntensity = 50
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  const gradientStyle = {
    background: `linear-gradient(135deg, ${config.colors.join(', ')})`,
    backgroundSize: '200% 200%',
    animation: `gradient-shift 15s ease infinite`,
    transition: 'all 1s ease-in-out'
  };

  const parallaxTransform = interactive
    ? `translate(${mousePos.x * parallaxIntensity}px, ${mousePos.y * parallaxIntensity}px)`
    : 'none';

  return (
    <div
      ref={sceneRef}
      className="fixed inset-0 -z-10 overflow-hidden"
      style={gradientStyle}
    >
      {/* Parallax layer 1 (background) */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          transform: `${parallaxTransform} scale(1.1)`,
          transition: 'transform 0.3s ease-out',
          background: `radial-gradient(circle at 50% 50%, ${config.colors[0]}, transparent)`
        }}
      />

      {/* Parallax layer 2 (middle) */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          transform: `translate(${mousePos.x * parallaxIntensity * 1.5}px, ${mousePos.y * parallaxIntensity * 1.5}px) scale(1.2)`,
          transition: 'transform 0.2s ease-out',
          background: `radial-gradient(circle at 30% 70%, ${config.colors[1]}, transparent)`
        }}
      />

      {/* Particle layer */}
      {config.particles && <ParticleLayer config={config.particles} />}

      {/* Ambient glow overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at center, ${config.colors[config.colors.length - 1]}, transparent)`,
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />
    </div>
  );
};

// Particle layer component
const ParticleLayer: React.FC<{ config: any }> = ({ config }) => {
  const particleCount = config.density === 'low' ? 20 : config.density === 'medium' ? 40 : 60;
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 20
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-1 h-1 bg-white rounded-full opacity-60"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `float ${p.duration}s linear ${p.delay}s infinite`,
            filter: 'blur(1px)'
          }}
        />
      ))}
    </div>
  );
};
```

---

### Step 4: Create Adaptive Scene Manager

Create `client/src/components/scene/AdaptiveSceneManager.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { SceneContext } from '@/types/scene';
import { detectDeviceCapabilities } from '@/utils/capabilityDetector';
import { getSceneForContext, getCurrentTimeOfDay } from '@/utils/scenePresets';
import { CSSSceneRenderer } from './CSSSceneRenderer';

interface AdaptiveSceneManagerProps {
  avatarState?: 'neutral' | 'thinking' | 'responding' | 'listening';
  mood?: 'calm' | 'energetic' | 'romantic' | 'mysterious' | 'playful';
  enableAnimations?: boolean;
}

export const AdaptiveSceneManager: React.FC<AdaptiveSceneManagerProps> = ({
  avatarState = 'neutral',
  mood = 'calm',
  enableAnimations = true
}) => {
  const [capabilities] = useState(() => detectDeviceCapabilities());
  const [timeOfDay, setTimeOfDay] = useState(getCurrentTimeOfDay());

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getCurrentTimeOfDay());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Respect reduced motion preference
  if (capabilities.prefersReducedMotion || !enableAnimations) {
    const simpleScene = getSceneForContext(timeOfDay, mood);
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, ${simpleScene.colors.join(', ')})`
        }}
      />
    );
  }

  const sceneConfig = getSceneForContext(timeOfDay, mood);

  return (
    <CSSSceneRenderer
      config={sceneConfig}
      interactive={capabilities.gpuTier !== 'low'}
      parallaxIntensity={capabilities.gpuTier === 'high' ? 50 : 25}
    />
  );
};
```

---

### Step 5: Add CSS Animations

Add to `client/src/index.css`:
```css
/* Scene animations */
@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.3;
  }
}

@keyframes float {
  0% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) translateX(20px) scale(0.8);
    opacity: 0;
  }
}

@keyframes gentle-wave {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.02);
  }
}

@keyframes breathing {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.4;
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}
```

---

### Step 6: Integrate into App.tsx

Update `client/src/App.tsx`:
```typescript
import { AdaptiveSceneManager } from '@/components/scene/AdaptiveSceneManager';

function App() {
  const [avatarState, setAvatarState] = useState<'neutral' | 'thinking' | 'responding' | 'listening'>('neutral');
  const [sceneMood, setSceneMood] = useState<'calm' | 'energetic' | 'romantic' | 'mysterious' | 'playful'>('calm');
  
  // ... existing state and logic ...

  return (
    <div className="min-h-screen relative">
      {/* Adaptive Scene Background */}
      <AdaptiveSceneManager 
        avatarState={avatarState}
        mood={sceneMood}
        enableAnimations={true}
      />

      {/* Rest of your app content */}
      {/* ... */}
    </div>
  );
}
```

---

### Step 7: Add Settings Panel Controls

Add to `client/src/components/SettingsPanel.tsx`:
```typescript
interface SettingsPanelProps {
  // ... existing props ...
  sceneSettings?: {
    enabled: boolean;
    mood: 'calm' | 'energetic' | 'romantic' | 'mysterious' | 'playful';
    enableParticles: boolean;
    enableParallax: boolean;
  };
  onSceneSettingsChange?: (settings: any) => void;
}

// Add in the settings panel render:
<Card>
  <CardHeader>
    <CardTitle>Scene Settings</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <label>Adaptive Background</label>
      <Switch
        checked={sceneSettings?.enabled}
        onCheckedChange={(enabled) =>
          onSceneSettingsChange?.({ ...sceneSettings, enabled })
        }
      />
    </div>
    
    <div>
      <label>Scene Mood</label>
      <Select
        value={sceneSettings?.mood}
        onValueChange={(mood) =>
          onSceneSettingsChange?.({ ...sceneSettings, mood })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="calm">Calm</SelectItem>
          <SelectItem value="energetic">Energetic</SelectItem>
          <SelectItem value="romantic">Romantic</SelectItem>
          <SelectItem value="mysterious">Mysterious</SelectItem>
          <SelectItem value="playful">Playful</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <div className="flex items-center justify-between">
      <label>Particle Effects</label>
      <Switch
        checked={sceneSettings?.enableParticles}
        onCheckedChange={(enableParticles) =>
          onSceneSettingsChange?.({ ...sceneSettings, enableParticles })
        }
      />
    </div>
    
    <div className="flex items-center justify-between">
      <label>Parallax Effect</label>
      <Switch
        checked={sceneSettings?.enableParallax}
        onCheckedChange={(enableParallax) =>
          onSceneSettingsChange?.({ ...sceneSettings, enableParallax })
        }
      />
    </div>
  </CardContent>
</Card>
```

---

## Testing the Implementation

### 1. Manual Testing
```bash
npm run dev
```

Test scenarios:
- ✅ Different times of day (change system time)
- ✅ Different moods (use settings panel)
- ✅ Reduced motion preference (browser settings)
- ✅ Mobile devices (responsive testing)
- ✅ Low-spec devices (throttle CPU in DevTools)

### 2. Performance Testing
```javascript
// Add to component for monitoring
useEffect(() => {
  let frameCount = 0;
  let lastTime = performance.now();
  
  const measureFPS = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      console.log(`FPS: ${fps}`);
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
  };
  
  requestAnimationFrame(measureFPS);
}, []);
```

---

## Future Enhancements (Optional)

### 1. WebGL Renderer (Advanced)
Create `client/src/components/scene/WebGLSceneRenderer.tsx` using @react-three/fiber for high-end devices.

### 2. Conversation Context Integration
```typescript
// Analyze conversation sentiment to adjust mood
function getMoodFromConversation(messages: Message[]): SceneMood {
  const recentMessages = messages.slice(-5);
  // Implement sentiment analysis
  // Return appropriate mood
}
```

### 3. Custom User Scenes
Allow users to create and save custom color schemes and particle configurations.

---

## Summary

**For immediate implementation, focus on:**
1. ✅ CSS-based scene renderer (Steps 1-6)
2. ✅ Time-based automatic scenes
3. ✅ Settings panel integration
4. ✅ Accessibility (reduced motion support)

**For future enhancements:**
- WebGL renderer for high-end devices
- AI-driven mood detection
- User-created custom scenes
- Seasonal/event-based themes

**Expected Outcomes:**
- Dynamic, engaging background that responds to context
- Excellent performance on all devices
- Accessible and user-controllable
- Extensible architecture for future features
