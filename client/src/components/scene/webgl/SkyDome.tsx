import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  SKY_DOME_FRAGMENT_SHADER,
  SKY_DOME_VERTEX_SHADER,
} from './particleShaders';

interface SkyDomeProps {
  topColor: string;
  bottomColor: string;
  animationSpeed: number;
}

/**
 * Procedurally generated dynamic skybox: a large inverted sphere shaded
 * with a vertical gradient between two scene colors. Cheap to render
 * (single draw call, no textures) yet gives a convincing sense of depth
 * and atmosphere behind the particle field.
 */
export const SkyDome: React.FC<SkyDomeProps> = ({
  topColor,
  bottomColor,
  animationSpeed,
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTopColor: { value: new THREE.Color(topColor) },
      uBottomColor: { value: new THREE.Color(bottomColor) },
      uOffset: { value: 40 },
      uExponent: { value: 0.7 },
    }),
    // Colors are updated in-place below on change; only recreate uniforms once.
    []
  );

  // Smoothly transition sky colors when time-of-day/mood changes instead of
  // popping, which keeps the "dynamic skybox" feeling continuous.
  useFrame((_, delta) => {
    const lerpSpeed = Math.min(1, delta * animationSpeed * 0.8);
    const top = uniforms.uTopColor.value as THREE.Color;
    const bottom = uniforms.uBottomColor.value as THREE.Color;
    top.lerp(new THREE.Color(topColor), lerpSpeed);
    bottom.lerp(new THREE.Color(bottomColor), lerpSpeed);
  });

  return (
    <mesh scale={[1, 1, 1]}>
      <sphereGeometry args={[500, 32, 15]} />
      <shaderMaterial
        ref={materialRef}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={SKY_DOME_VERTEX_SHADER}
        fragmentShader={SKY_DOME_FRAGMENT_SHADER}
      />
    </mesh>
  );
};
