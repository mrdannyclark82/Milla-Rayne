import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BURST_PARTICLE_FRAGMENT_SHADER,
  BURST_PARTICLE_VERTEX_SHADER,
} from './particleShaders';

export interface BurstSpawn {
  id: number;
  position: THREE.Vector3;
  color: THREE.Color;
  startTime: number;
}

const PARTICLES_PER_BURST = 60;
const BURST_DURATION = 1.4;

interface SingleBurstProps {
  spawn: BurstSpawn;
  onComplete: (id: number) => void;
}

const SingleBurst: React.FC<SingleBurstProps> = ({ spawn, onComplete }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const completedRef = useRef(false);

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLES_PER_BURST * 3);
    const velocities = new Float32Array(PARTICLES_PER_BURST * 3);
    const scales = new Float32Array(PARTICLES_PER_BURST);

    for (let i = 0; i < PARTICLES_PER_BURST; i++) {
      positions[i * 3] = spawn.position.x;
      positions[i * 3 + 1] = spawn.position.y;
      positions[i * 3 + 2] = spawn.position.z;

      // Random outward direction on a sphere, scaled to a burst speed —
      // real physics-based radial expansion computed once, then animated
      // purely on the GPU via the vertex shader's uElapsed uniform.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 4 + Math.random() * 6;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i * 3 + 2] = Math.cos(phi) * speed;

      scales[i] = 0.5 + Math.random() * 1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    return geo;
  }, []);

  const uniforms = useMemo(
    () => ({
      uElapsed: { value: 0 },
      uDuration: { value: BURST_DURATION },
      uSize: { value: 10 },
      uPixelRatio: {
        value: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      },
      uGravity: { value: 6 },
      uColor: { value: spawn.color.clone() },
    }),
    []
  );

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime - spawn.startTime;
    uniforms.uElapsed.value = elapsed;

    if (elapsed >= BURST_DURATION && !completedRef.current) {
      completedRef.current = true;
      onComplete(spawn.id);
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={BURST_PARTICLE_VERTEX_SHADER}
        fragmentShader={BURST_PARTICLE_FRAGMENT_SHADER}
      />
    </points>
  );
};

interface BurstFieldProps {
  bursts: BurstSpawn[];
  onBurstComplete: (id: number) => void;
}

/**
 * Renders all active click-to-spawn burst effects. Each burst is an
 * independent GPU-animated particle explosion that self-removes once its
 * lifetime elapses (tracked via the shared Three.js clock, not timers).
 */
export const BurstField: React.FC<BurstFieldProps> = ({
  bursts,
  onBurstComplete,
}) => {
  return (
    <>
      {bursts.map((spawn) => (
        <SingleBurst
          key={spawn.id}
          spawn={spawn}
          onComplete={onBurstComplete}
        />
      ))}
    </>
  );
};

export { BURST_DURATION };
