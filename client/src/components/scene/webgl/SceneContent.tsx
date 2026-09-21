import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleConfig, SceneMood, TimeOfDay } from '@/types/scene';
import { SkyDome } from './SkyDome';
import { LightRig } from './LightRig';
import { AmbientParticleField } from './AmbientParticleField';
import { BurstField, BurstSpawn } from './BurstField';
import { CameraRig } from './CameraRig';
import { PerformanceMonitor } from './PerformanceMonitor';
import { getLightingPreset, particleCountForDensity } from './particlePresets';
import { PARTICLE_PHYSICS_PRESETS } from './particlePresets';

interface SceneContentProps {
  colors: string[];
  particles?: ParticleConfig;
  particleDensity: 'off' | 'low' | 'medium' | 'high';
  timeOfDay: TimeOfDay;
  mood: SceneMood;
  animationSpeed: number;
  interactive: boolean;
  onFpsSample?: (fps: number) => void;
}

const LOW_FPS_THRESHOLD = 30;
const CONSECUTIVE_LOW_SAMPLES_TO_DEGRADE = 3;

export const SceneContent: React.FC<SceneContentProps> = ({
  colors,
  particles,
  particleDensity,
  timeOfDay,
  mood,
  animationSpeed,
  interactive,
  onFpsSample,
}) => {
  const [degradeTier, setDegradeTier] = useState(0);
  const lowFpsStreak = useRef(0);
  const [bursts, setBursts] = useState<BurstSpawn[]>([]);
  const burstIdRef = useRef(0);

  const lighting = useMemo(
    () => getLightingPreset(timeOfDay, mood),
    [timeOfDay, mood]
  );

  const skyTop = colors[0] || '#203A43';
  const skyBottom = colors[colors.length - 1] || '#0F2027';

  const particleType = particles?.type || 'stars';

  // Adaptive quality: performance monitor reports sustained low FPS, we
  // tier down the particle count in response (never re-upgrades within the
  // same session to avoid oscillation/thrashing).
  const baseCount = particleCountForDensity(particleDensity);
  const degradeFactors = [1, 0.5, 0.25];
  const effectiveCount = Math.round(
    baseCount * degradeFactors[Math.min(degradeTier, degradeFactors.length - 1)]
  );

  const handleFpsSample = useCallback(
    (fps: number) => {
      onFpsSample?.(fps);

      if (fps < LOW_FPS_THRESHOLD) {
        lowFpsStreak.current += 1;
        if (lowFpsStreak.current >= CONSECUTIVE_LOW_SAMPLES_TO_DEGRADE) {
          setDegradeTier((tier) => Math.min(tier + 1, degradeFactors.length - 1));
          lowFpsStreak.current = 0;
        }
      } else {
        lowFpsStreak.current = 0;
      }
    },
    [onFpsSample]
  );

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!interactive) return;
      event.stopPropagation();

      const preset = PARTICLE_PHYSICS_PRESETS[particleType];
      const burstColor = new THREE.Color(...preset.color);

      setBursts((current) => [
        ...current,
        {
          id: burstIdRef.current++,
          position: event.point.clone(),
          color: burstColor,
          startTime: event.timeStamp
            ? event.timeStamp / 1000
            : performance.now() / 1000,
        },
      ]);
    },
    [interactive, particleType]
  );

  const handleBurstComplete = useCallback((id: number) => {
    setBursts((current) => current.filter((b) => b.id !== id));
  }, []);

  return (
    <>
      <SkyDome
        topColor={skyTop}
        bottomColor={skyBottom}
        animationSpeed={animationSpeed}
      />
      <LightRig
        ambientColor={lighting.ambientColor}
        ambientIntensity={lighting.ambientIntensity}
        keyColor={lighting.moodKeyColor}
        keyIntensity={lighting.keyIntensity}
        animationSpeed={animationSpeed}
      />
      <fog
        attach="fog"
        args={[skyBottom, 40, 260 / Math.max(lighting.fogDensity, 0.1)]}
      />

      <AmbientParticleField
        type={particleType}
        count={effectiveCount}
        animationSpeed={animationSpeed}
      />

      <BurstField bursts={bursts} onBurstComplete={handleBurstComplete} />

      {/* Invisible interaction plane: captures clicks to spawn burst
          effects at the clicked world position ("click-to-spawn effects"). */}
      <mesh
        position={[0, 0, -20]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[300, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <CameraRig enabled={interactive} />
      <PerformanceMonitor onSample={handleFpsSample} />
    </>
  );
};
