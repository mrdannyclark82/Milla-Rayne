/**
 * useRPScene Hook
 * Polls /api/rp/scenes/current to get the active RP scene state
 * Implements intelligent polling with visibility-aware backoff
 */

import { useState, useEffect, useRef } from 'react';

export interface RPSceneData {
  location: string;
  mood: string;
  updatedAt: number;
}

interface UseRPSceneOptions {
  enabled?: boolean;
  pollingInterval?: number; // default 1000ms
  backgroundInterval?: number; // default 5000ms when tab is hidden
}

export function useRPScene(options: UseRPSceneOptions = {}) {
  const {
    enabled = true,
    pollingInterval = 1000,
    backgroundInterval = 5000,
  } = options;

  const [sceneData, setSceneData] = useState<RPSceneData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);

  // Cleanup function to stop polling
  const stopPolling = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Fetch scene data
  const fetchScene = async () => {
    if (!enabled) return;

    try {
      const response = await fetch('/api/rp/scenes/current');
      if (!response.ok) {
        throw new Error(`Failed to fetch scene: ${response.statusText}`);
      }

      const data: RPSceneData = await response.json();
      setSceneData(data);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching RP scene:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsLoading(false);
    }
  };

  // Start polling with dynamic interval based on visibility
  const startPolling = () => {
    stopPolling(); // Clear any existing interval

    const currentInterval = isVisibleRef.current
      ? pollingInterval
      : backgroundInterval;

    intervalRef.current = window.setInterval(fetchScene, currentInterval);
  };

  // Handle visibility change
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;

      // Restart polling with new interval when visibility changes
      if (enabled) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, pollingInterval, backgroundInterval]);

  // Main effect for polling
  useEffect(() => {
    if (!enabled) {
      stopPolling();
      setSceneData(null);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchScene();

    // Start polling
    startPolling();

    // Cleanup on unmount or when enabled changes
    return stopPolling;
  }, [enabled, pollingInterval, backgroundInterval]);

  return {
    sceneData,
    isLoading,
    error,
    refetch: fetchScene,
  };
}
