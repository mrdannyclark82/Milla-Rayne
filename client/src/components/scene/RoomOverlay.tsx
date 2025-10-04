/**
 * RoomOverlay - Orchestrates room-specific overlays based on RP scene location
 * Renders location-specific silhouettes in the left 2/3 region
 */

import React, { useMemo } from 'react';
import { SceneLocation, TimeOfDay } from '@/types/scene';
import { useRPSceneContext } from './RPSceneBackgroundBridge';
import { loadSceneSettings } from '@/utils/sceneSettingsStore';
import { LivingRoomOverlay } from './overlays/LivingRoomOverlay';
import { KitchenOverlay } from './overlays/KitchenOverlay';
import { DiningOverlay } from './overlays/DiningOverlay';
import { BedroomOverlay } from './overlays/BedroomOverlay';
import { WorkspaceOverlay } from './overlays/WorkspaceOverlay';
import { BathroomOverlay } from './overlays/BathroomOverlay';
import { GuestRoomOverlay } from './overlays/GuestRoomOverlay';
import { OutdoorsOverlay } from './overlays/OutdoorsOverlay';

interface RoomOverlayProps {
  enabled: boolean;
  timeOfDay: TimeOfDay;
  location?: SceneLocation;
  reducedMotion?: boolean;
}

/**
 * Map RP location strings to SceneLocation types
 */
function normalizeLocation(location?: string): SceneLocation {
  if (!location) return 'unknown';
  
  // Normalize common variations
  const normalized = location.toLowerCase().replace(/[_\s-]/g, '');
  
  if (normalized.includes('living') || normalized.includes('lounge')) return 'living_room';
  if (normalized.includes('kitchen')) return 'kitchen';
  if (normalized.includes('dining')) return 'dining_room';
  if (normalized.includes('bedroom') && !normalized.includes('guest')) return 'bedroom';
  if (normalized.includes('guest') || normalized.includes('guestroom')) return 'bedroom'; // Use guest room overlay
  if (normalized.includes('bathroom') || normalized.includes('bath')) return 'bathroom';
  if (normalized.includes('office') || normalized.includes('workspace') || normalized.includes('study')) return 'bedroom'; // Use workspace overlay
  if (normalized.includes('outdoor') || normalized.includes('outside') || normalized.includes('porch') || normalized.includes('garden')) return 'outdoor';
  if (normalized.includes('car') || normalized.includes('vehicle')) return 'car';
  if (normalized.includes('door') || normalized.includes('entrance')) return 'front_door';
  
  return 'unknown';
}

export const RoomOverlay: React.FC<RoomOverlayProps> = ({ 
  enabled, 
  timeOfDay, 
  location: propLocation,
  reducedMotion = false 
}) => {
  // Get RP scene context
  const rpContext = useRPSceneContext();
  
  // Load settings to check if room overlays are enabled
  const settings = useMemo(() => loadSceneSettings(), []);
  
  // Determine effective location (prefer context over prop)
  const effectiveLocation = normalizeLocation(rpContext.location || propLocation);
  
  // Don't render if disabled or no valid location
  if (!enabled || !settings.sceneRoomOverlaysEnabled || effectiveLocation === 'unknown') {
    return null;
  }
  
  // Use RP context time of day if available
  const effectiveTimeOfDay = rpContext.timeOfDay || timeOfDay;
  
  // Render appropriate overlay based on location
  const renderOverlay = () => {
    const overlayProps = { timeOfDay: effectiveTimeOfDay, reducedMotion };
    
    switch (effectiveLocation) {
      case 'living_room':
        return <LivingRoomOverlay {...overlayProps} />;
      case 'kitchen':
        return <KitchenOverlay {...overlayProps} />;
      case 'dining_room':
        return <DiningOverlay {...overlayProps} />;
      case 'bedroom':
        // Check context for guest room hint
        if (rpContext.location?.toLowerCase().includes('guest')) {
          return <GuestRoomOverlay {...overlayProps} />;
        }
        return <BedroomOverlay {...overlayProps} />;
      case 'bathroom':
        return <BathroomOverlay {...overlayProps} />;
      case 'outdoor':
        return <OutdoorsOverlay {...overlayProps} />;
      default:
        // For workspace/office - check if context hints at it
        if (rpContext.location?.toLowerCase().includes('office') || 
            rpContext.location?.toLowerCase().includes('workspace') ||
            rpContext.location?.toLowerCase().includes('study')) {
          return <WorkspaceOverlay {...overlayProps} />;
        }
        return null;
    }
  };
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '66.6667vw', // Left 2/3
        height: '100vh',
        zIndex: -5, // Between background (-10) and stage (5)
        pointerEvents: 'none'
      }}
      aria-hidden="true"
    >
      {renderOverlay()}
    </div>
  );
};
