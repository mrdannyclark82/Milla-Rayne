import React from 'react';
import { useSceneContext } from '@/contexts/SceneContext';
import { WEATHER_EFFECTS } from '@/../../shared/scene-visuals';

export function WeatherLayer() {
  const { weatherEffect } = useSceneContext();

  if (weatherEffect === 'none') {
    return null;
  }

  const effect = WEATHER_EFFECTS[weatherEffect];

  return (
    <div className={`weather-layer ${weatherEffect}`}>
      {/* Render weather particles here based on the effect */}
    </div>
  );
}
