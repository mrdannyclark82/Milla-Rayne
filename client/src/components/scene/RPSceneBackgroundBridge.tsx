/**
 * RPSceneBackgroundBridge
 * Bridge component that connects RP scene state to AdaptiveSceneManager
 * Maps RP location to scene mood and determines indoor/outdoor settings
 */

import React, { useMemo } from 'react';
import { useRPScene } from '@/hooks/useRPScene';
import { SceneMood, TimeOfDay } from '@/types/scene';
import { getCurrentTimeOfDay, getLocationMood } from '@/utils/scenePresets';

interface RPSceneBackgroundBridgeProps {
  enabled: boolean;
  children: (props: {
    mood?: SceneMood;
    timeOfDay?: TimeOfDay;
    location?: string;
  }) => React.ReactElement;
}

/**
 * Map RP scene location to outdoor/indoor status
 */
function isOutdoorLocation(location: string): boolean {
  return location === 'outdoor';
}

export const RPSceneBackgroundBridge: React.FC<RPSceneBackgroundBridgeProps> = ({
  enabled,
  children
}) => {
  const { sceneData, isLoading } = useRPScene({ enabled });

  // Derive scene properties from RP state
  const sceneProps = useMemo(() => {
    if (!enabled || !sceneData || isLoading) {
      // When disabled or no data, return empty props (AdaptiveSceneManager will use defaults)
      return {};
    }

    const { location, mood } = sceneData;
    
    // Map location to mood (prefer detected mood, fall back to location-based mood)
    let derivedMood: SceneMood = 'calm';
    
    // If mood from server is valid, use it
    const validMoods: SceneMood[] = ['calm', 'energetic', 'romantic', 'mysterious', 'playful'];
    if (validMoods.includes(mood as SceneMood)) {
      derivedMood = mood as SceneMood;
    } else {
      // Fall back to location-based mood
      derivedMood = getLocationMood(location);
    }

    // For outdoor scenes at night, prefer mysterious mood for starry effect
    const timeOfDay = getCurrentTimeOfDay();
    const isOutdoor = isOutdoorLocation(location);
    
    if (isOutdoor && (timeOfDay === 'night' || timeOfDay === 'dusk')) {
      // Night outdoor scenes get mysterious mood (darker with stars)
      derivedMood = 'mysterious';
    } else if (isOutdoor && (timeOfDay === 'day' || timeOfDay === 'dawn')) {
      // Day outdoor scenes get playful or energetic mood (brighter)
      derivedMood = derivedMood === 'calm' ? 'playful' : derivedMood;
    }

    return {
      mood: derivedMood,
      timeOfDay,
      location
    };
  }, [enabled, sceneData, isLoading]);

  return children(sceneProps);
};
