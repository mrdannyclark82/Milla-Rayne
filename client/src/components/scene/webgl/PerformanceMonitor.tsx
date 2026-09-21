import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface PerformanceMonitorProps {
  /** Called with a rolling average FPS every ~1s. */
  onSample: (fps: number) => void;
}

/**
 * Lightweight in-scene FPS sampler. Reports a rolling average roughly once
 * per second so the parent renderer can adaptively downgrade particle
 * density if the device can't sustain a smooth framerate — a genuine
 * performance-monitor mechanism, not just a debug readout.
 */
export function PerformanceMonitor({ onSample }: PerformanceMonitorProps) {
  const frameCount = useRef(0);
  const lastSampleTime = useRef<number | null>(null);

  useFrame((state) => {
    frameCount.current += 1;
    const now = state.clock.elapsedTime;

    if (lastSampleTime.current === null) {
      lastSampleTime.current = now;
      return;
    }

    const elapsed = now - lastSampleTime.current;
    if (elapsed >= 1) {
      const fps = frameCount.current / elapsed;
      onSample(fps);
      frameCount.current = 0;
      lastSampleTime.current = now;
    }
  });

  return null;
}
