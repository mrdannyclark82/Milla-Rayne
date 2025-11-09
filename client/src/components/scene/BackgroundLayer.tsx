import React, { useState, useEffect } from 'react';
import { useSceneContext } from '@/contexts/SceneContext';

/**
 * Static background image component for scene display
 * Fills the left 2/3 of the screen with location-based images
 * Default: front_door.jpg (entering Milla's world)
 */
export function BackgroundLayer() {
  const { location } = useSceneContext();
  const [imageSrc, setImageSrc] = useState<string>(
    '/assets/scenes/front_door.jpg'
  );
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Map location to image path - using actual filenames from /client/public/assets/scenes/
    const locationImageMap: Record<string, string> = {
      front_door: '/assets/scenes/front_door.jpg',
      living_room: '/assets/scenes/living_room-fireplace.jpg', // Default living room variant
      bedroom: '/assets/scenes/bedroom.jpg',
      bathroom: '/assets/scenes/bathroom.jpg',
      kitchen: '/assets/scenes/kitchen.jpg',
      outdoor: '/assets/scenes/outdoor-night.jpg',
      dining_room: '/assets/scenes/living_room-fireplace.jpg', // Fallback to living room
      workspace: '/assets/scenes/living_room-fireplace.jpg', // Fallback to living room
      guest_room: '/assets/scenes/bedroom.jpg', // Fallback to bedroom
    };

    const newImageSrc =
      locationImageMap[location] || '/assets/scenes/front_door.jpg';
    setImageLoaded(false);
    setImageSrc(newImageSrc);
  }, [location]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      <img
        src={imageSrc}
        alt=""
        onLoad={() => setImageLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
        }}
      />
    </div>
  );
}
