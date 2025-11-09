/**
 * RealisticSceneBackground Component
 *
 * Displays static image backgrounds based on current scene context.
 * Supports time-of-day variants and automatic fallback to CSS animated backgrounds.
 *
 * Image Mapping:
 * - Primary: /assets/scenes/{location}-{timeOfDay}.jpg (e.g., living_room-night.jpg)
 * - Fallback: /assets/scenes/{location}.jpg (e.g., living_room.jpg)
 * - Final fallback: CSS animated gradient background
 *
 * File Naming Convention:
 * - Base: {location}.jpg
 * - Time variant: {location}-{time}.jpg where time is: morning, day, dusk, or night
 *
 * Example files:
 * - /public/assets/scenes/living_room.jpg
 * - /public/assets/scenes/living_room-morning.jpg
 * - /public/assets/scenes/living_room-night.jpg
 * - /public/assets/scenes/kitchen.jpg
 * - /public/assets/scenes/bedroom-night.jpg
 *
 * See /client/public/assets/scenes/README.md for complete documentation.
 */

import React, { useState, useEffect } from 'react';
import { SceneLocation, TimeOfDay } from '@/types/scene';
import { getSceneForContext } from '@/utils/scenePresets';

interface RealisticSceneBackgroundProps {
  location: SceneLocation;
  timeOfDay: TimeOfDay;
  region?: 'full' | 'left-2-3';
  onImageLoadError?: () => void;
  onImageLoadSuccess?: () => void;
}

/**
 * Build the image URL for a given location and time of day
 * Returns an array of URLs to try in order (time-specific, base, fallback)
 */
function getImageUrls(location: SceneLocation, timeOfDay: TimeOfDay): string[] {
  if (location === 'unknown') {
    return []; // No images for unknown location
  }

  const urls: string[] = [];

  // Try time-specific variant first: living_room-night.jpg/jpeg
  urls.push(`/assets/scenes/${location}-${timeOfDay}.jpeg`);
  urls.push(`/assets/scenes/${location}-${timeOfDay}.jpg`);
  urls.push(`/assets/scenes/${location}-${timeOfDay}.png`);

  // Try base location image: living_room.jpg/jpeg
  urls.push(`/assets/scenes/${location}.jpeg`);
  urls.push(`/assets/scenes/${location}.jpg`);
  urls.push(`/assets/scenes/${location}.png`);

  return urls;
}

export const RealisticSceneBackground: React.FC<
  RealisticSceneBackgroundProps
> = ({
  location,
  timeOfDay,
  region = 'full',
  onImageLoadError,
  onImageLoadSuccess,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Try to load images when location or time changes
  useEffect(() => {
    const urls = getImageUrls(location, timeOfDay);

    if (urls.length === 0) {
      setImageUrl(null);
      setImageError(true);
      setImageLoading(false);
      return;
    }

    let currentUrlIndex = 0;
    let isActive = true;

    const tryNextImage = () => {
      if (!isActive || currentUrlIndex >= urls.length) {
        // All URLs failed, use CSS fallback
        setImageUrl(null);
        setImageError(true);
        setImageLoading(false);
        onImageLoadError?.();
        return;
      }

      const url = urls[currentUrlIndex];
      const img = new Image();

      img.onload = () => {
        if (isActive) {
          setImageUrl(url);
          setImageError(false);
          setImageLoading(false);
          onImageLoadSuccess?.();
        }
      };

      img.onerror = () => {
        currentUrlIndex++;
        tryNextImage();
      };

      img.src = url;
    };

    setImageLoading(true);
    setImageError(false);
    tryNextImage();

    return () => {
      isActive = false;
    };
  }, [location, timeOfDay, onImageLoadError, onImageLoadSuccess]);

  // Determine positioning based on region
  const regionStyle =
    region === 'left-2-3'
      ? {
          position: 'fixed' as const,
          top: 0,
          left: 0,
          width: '66.6667vw',
          height: '100vh',
          zIndex: -10,
          pointerEvents: 'none' as const,
          display: 'flex' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        }
      : {
          position: 'fixed' as const,
          inset: 0,
          zIndex: -10,
          pointerEvents: 'none' as const,
        };

  // If image failed to load or is loading, return CSS fallback
  if (imageError || !imageUrl) {
    const fallbackScene = getSceneForContext(timeOfDay, 'calm');

    return (
      <div
        className="transition-opacity duration-1000"
        style={{
          ...regionStyle,
          background: `linear-gradient(135deg, ${fallbackScene.colors.join(', ')})`,
        }}
        aria-hidden="true"
        role="presentation"
      >
        {/* Placeholder comment for when no image is available */}
        {/* Add images to /public/assets/scenes/ to enable static backgrounds */}
        {/* See /client/public/assets/scenes/README.md for details */}
      </div>
    );
  }

  // Render the static image background
  return (
    <div
      className="transition-opacity duration-1000"
      style={{
        ...regionStyle,
        opacity: imageLoading ? 0 : 1,
      }}
      aria-hidden="true"
      role="presentation"
    >
      <img
        src={imageUrl}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
        }}
      />
    </div>
  );
};
