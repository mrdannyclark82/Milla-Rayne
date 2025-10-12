import React, { useState, useEffect } from 'react';
import { useSceneContext } from '@/contexts/SceneContext';
import { SCENE_LOCATION_MAP } from '@/../../shared/sceneSettings';
import type { SceneBackground } from '@/../../shared/sceneTypes';

export function BackgroundLayer() {
  const { location } = useSceneContext();
  const [currentBackground, setCurrentBackground] =
    useState<SceneBackground | null>(null);

  useEffect(() => {
    const scene = SCENE_LOCATION_MAP[location];
    if (scene && scene.backgrounds.length > 0) {
      setCurrentBackground(scene.backgrounds[0]);

      if (scene.backgrounds.length > 1) {
        const interval = setInterval(() => {
          const currentIndex = scene.backgrounds.indexOf(currentBackground!);
          const nextIndex = (currentIndex + 1) % scene.backgrounds.length;
          setCurrentBackground(scene.backgrounds[nextIndex]);
        }, 30000); // Change background every 30 seconds

        return () => clearInterval(interval);
      }
    }
  }, [location, currentBackground]);

  if (!currentBackground) {
    return null;
  }

  return (
    <div
      className="background-layer"
      style={{
        backgroundImage: `url(${currentBackground.src})`,
      }}
    />
  );
}
