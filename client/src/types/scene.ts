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
