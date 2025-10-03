import { DeviceCapabilities } from '@/types/scene';

export function detectDeviceCapabilities(): DeviceCapabilities {
  // Check WebGL support
  const canvas = document.createElement('canvas');
  const webGL = !!(
    canvas.getContext('webgl') || 
    canvas.getContext('experimental-webgl')
  );

  // Detect reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Get screen size
  const screenSize = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  // Simple GPU tier detection (can be enhanced)
  let gpuTier: 'low' | 'medium' | 'high' = 'medium';
  if (screenSize.width < 768 || !webGL) {
    gpuTier = 'low';
  } else if (screenSize.width > 1920 && webGL) {
    gpuTier = 'high';
  }

  return {
    webGL,
    gpuTier,
    prefersReducedMotion,
    screenSize
  };
}
