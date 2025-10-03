/**
 * Example App Integration with Adaptive Scene System
 * This is a demo showing how to integrate the scene system into App.tsx
 * 
 * DO NOT USE THIS FILE DIRECTLY - it's a reference/example only
 */

import React, { useState, useEffect } from 'react';
import { SceneContainer } from '@/components/scene';
import { getAdaptiveSceneConfig } from '@/lib/scene/featureFlags';
import type { AppState } from '@shared/sceneTypes';

function AppWithScenes() {
  // Get scene configuration from feature flags
  const [sceneConfig, setSceneConfig] = useState(() => getAdaptiveSceneConfig());
  
  // Track app state for adaptive visuals
  const [appState, setAppState] = useState<AppState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Update app state based on user interactions
  useEffect(() => {
    if (isListening) {
      setAppState('listening');
    } else if (isLoading) {
      setAppState('thinking');
    } else if (isSpeaking) {
      setAppState('speaking');
    } else {
      setAppState('idle');
    }
  }, [isListening, isLoading, isSpeaking]);

  // Listen for storage changes (when feature flags are toggled)
  useEffect(() => {
    const handleStorageChange = () => {
      setSceneConfig(getAdaptiveSceneConfig());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <SceneContainer
      enabled={sceneConfig.enabled}
      appState={appState}
      performanceMode={sceneConfig.performanceMode}
    >
      {/* Your existing app content goes here */}
      <div className="min-h-screen bg-black">
        {/* Existing content unchanged */}
        <h1>Your App Content</h1>
        
        {/* Example: Update app state when user interacts */}
        <button onClick={() => setIsListening(!isListening)}>
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
      </div>
    </SceneContainer>
  );
}

export default AppWithScenes;

/* 
 * INTEGRATION NOTES:
 * 
 * 1. Wrap your entire App component with <SceneContainer>
 * 2. Pass enabled={sceneConfig.enabled} to gate the feature
 * 3. Update appState based on your app's current state:
 *    - 'idle': Default state
 *    - 'listening': When user is speaking/recording
 *    - 'thinking': When AI is processing
 *    - 'speaking': When AI is responding with voice
 * 
 * 4. When sceneConfig.enabled is false, SceneContainer renders 
 *    children only (zero overhead)
 * 
 * 5. To enable in development:
 *    Open browser console and run:
 *    localStorage.setItem('adaptiveScenes.enabled', 'true')
 *    Then refresh the page
 * 
 * 6. The scene system will automatically:
 *    - Adapt to time of day
 *    - Respect reduced motion preferences
 *    - Pause animations when tab is backgrounded
 *    - Adjust based on performance mode
 */
