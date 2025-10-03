import React, { useState, useEffect } from 'react';
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
        aria-hidden="true"
        role="presentation"
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
