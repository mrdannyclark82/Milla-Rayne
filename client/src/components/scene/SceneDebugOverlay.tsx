/**
 * Scene Debug Overlay
 * Development-only overlay showing scene state and performance metrics
 */

import React, { useState, useEffect } from 'react';
import { DeviceCapabilities, TimeOfDay, SceneMood } from '@/types/scene';

interface SceneDebugOverlayProps {
  capabilities: DeviceCapabilities;
  timeOfDay: TimeOfDay;
  mood: SceneMood;
  particlesEnabled: boolean;
  parallaxEnabled: boolean;
  animationSpeed: number;
}

export const SceneDebugOverlay: React.FC<SceneDebugOverlayProps> = ({
  capabilities,
  timeOfDay,
  mood,
  particlesEnabled,
  parallaxEnabled,
  animationSpeed,
}) => {
  const [fps, setFps] = useState<number>(0);
  const [showFps, setShowFps] = useState(false);

  // Simple FPS counter
  useEffect(() => {
    if (!showFps) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const countFrames = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(countFrames);
    };

    animationFrameId = requestAnimationFrame(countFrames);
    return () => cancelAnimationFrame(animationFrameId);
  }, [showFps]);

  return (
    <div
      className="fixed top-4 left-4 z-50 bg-black/80 text-white text-xs font-mono p-3 rounded-lg border border-green-500/50 pointer-events-auto"
      style={{ maxWidth: '280px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-green-400 font-bold">Scene Debug</span>
        <button
          onClick={() => setShowFps(!showFps)}
          className="text-xs px-2 py-0.5 bg-green-900/30 hover:bg-green-900/50 rounded border border-green-500/30"
          title="Toggle FPS counter"
        >
          {showFps ? 'Hide FPS' : 'Show FPS'}
        </button>
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-400">GPU Tier:</span>
            <span className="ml-1 text-green-300">{capabilities.gpuTier}</span>
          </div>
          <div>
            <span className="text-gray-400">WebGL:</span>
            <span className="ml-1 text-green-300">
              {capabilities.webGL ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-gray-400">Reduced Motion:</span>
          <span className="ml-1 text-green-300">
            {capabilities.prefersReducedMotion ? 'ON' : 'OFF'}
          </span>
        </div>

        <div className="border-t border-gray-700 my-2"></div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-400">Time:</span>
            <span className="ml-1 text-yellow-300">{timeOfDay}</span>
          </div>
          <div>
            <span className="text-gray-400">Mood:</span>
            <span className="ml-1 text-purple-300">{mood}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-400">Particles:</span>
            <span className="ml-1 text-blue-300">
              {particlesEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Parallax:</span>
            <span className="ml-1 text-blue-300">
              {parallaxEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-gray-400">Animation Speed:</span>
          <span className="ml-1 text-cyan-300">
            {(animationSpeed * 100).toFixed(0)}%
          </span>
        </div>

        {showFps && (
          <>
            <div className="border-t border-gray-700 my-2"></div>
            <div>
              <span className="text-gray-400">FPS:</span>
              <span
                className={`ml-1 font-bold ${fps > 50 ? 'text-green-400' : fps > 30 ? 'text-yellow-400' : 'text-red-400'}`}
              >
                {fps}
              </span>
            </div>
          </>
        )}

        <div className="border-t border-gray-700 my-2"></div>
        <div className="text-gray-500 text-[10px]">
          Screen: {capabilities.screenSize.width}x
          {capabilities.screenSize.height}
        </div>
      </div>
    </div>
  );
};
