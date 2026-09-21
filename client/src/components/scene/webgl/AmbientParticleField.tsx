import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleType } from '@/types/scene';
import {
  AMBIENT_PARTICLE_FRAGMENT_SHADER,
  AMBIENT_PARTICLE_VERTEX_SHADER,
} from './particleShaders';
import { PARTICLE_PHYSICS_PRESETS } from './particlePresets';

interface AmbientParticleFieldProps {
  type: ParticleType;
  count: number;
  animationSpeed: number;
  bounds?: { width: number; height: number; depth: number };
}

/**
 * GPU-accelerated ambient particle field. Thousands of particles are
 * animated entirely on the GPU (drift, turbulence, gravity, wraparound,
 * twinkle all live in the vertex shader), so CPU cost stays essentially
 * flat regardless of particle count.
 */
export const AmbientParticleField: React.FC<AmbientParticleFieldProps> = ({
  type,
  count,
  animationSpeed,
  bounds = { width: 90, height: 55, depth: 70 },
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const preset = PARTICLE_PHYSICS_PRESETS[type];

  const boundsMinY = -bounds.height / 2;
  const boundsMaxY = bounds.height / 2;

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * bounds.width;
      positions[i * 3 + 1] = boundsMinY + Math.random() * bounds.height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.depth - 10;

      randoms[i * 3] = Math.random();
      randoms[i * 3 + 1] = Math.random();
      randoms[i * 3 + 2] = Math.random();

      scales[i] = 0.5 + Math.random() * 1.2;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return geo;
    // Regenerate only when particle count/bounds/type change (adaptive
    // quality tiering swaps `count`), not every render.
  }, [count, bounds.width, bounds.height, bounds.depth, type]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: preset.speedMultiplier },
      uSize: { value: preset.size },
      uPixelRatio: {
        value: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      },
      uBoundsMinY: { value: boundsMinY },
      uBoundsMaxY: { value: boundsMaxY },
      uGravity: { value: preset.gravity },
      uTurbulence: { value: preset.turbulence },
      uColor: { value: new THREE.Color(...preset.color) },
      uColor2: { value: new THREE.Color(...preset.color2) },
      uOpacity: { value: preset.opacity },
    }),
    [type]
  );

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uSpeed.value = preset.speedMultiplier * animationSpeed;
    void delta;
  });

  if (count <= 0) {
    return null;
  }

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={AMBIENT_PARTICLE_VERTEX_SHADER}
        fragmentShader={AMBIENT_PARTICLE_FRAGMENT_SHADER}
      />
    </points>
  );
};
