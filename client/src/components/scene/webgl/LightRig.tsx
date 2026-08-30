import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  LIGHT_SHAFT_FRAGMENT_SHADER,
  LIGHT_SHAFT_VERTEX_SHADER,
} from './particleShaders';

interface LightRigProps {
  ambientColor: string;
  ambientIntensity: number;
  keyColor: string;
  keyIntensity: number;
  animationSpeed: number;
}

/**
 * Scene lighting rig: ambient fill + a colored key light, plus a small set
 * of additive "light shaft" planes that approximate volumetric lighting
 * around the key light without the cost of a real raymarched volumetric
 * pass (which would not be viable as an always-on chat background).
 */
export const LightRig: React.FC<LightRigProps> = ({
  ambientColor,
  ambientIntensity,
  keyColor,
  keyIntensity,
  animationSpeed,
}) => {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const shaftGroupRef = useRef<THREE.Group>(null);

  const shaftUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(keyColor) },
      uOpacity: { value: 0.18 },
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((state, delta) => {
    const lerpSpeed = Math.min(1, delta * animationSpeed * 0.8);

    if (ambientRef.current) {
      ambientRef.current.color.lerp(new THREE.Color(ambientColor), lerpSpeed);
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        ambientIntensity,
        lerpSpeed
      );
    }

    if (keyLightRef.current) {
      keyLightRef.current.color.lerp(new THREE.Color(keyColor), lerpSpeed);
      keyLightRef.current.intensity = THREE.MathUtils.lerp(
        keyLightRef.current.intensity,
        keyIntensity,
        lerpSpeed
      );
    }

    (shaftUniforms.uColor.value as THREE.Color).lerp(
      new THREE.Color(keyColor),
      lerpSpeed
    );
    shaftUniforms.uTime.value = state.clock.elapsedTime;

    if (shaftGroupRef.current) {
      shaftGroupRef.current.rotation.y +=
        delta * 0.05 * animationSpeed;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} color={ambientColor} intensity={ambientIntensity} />
      <pointLight
        ref={keyLightRef}
        color={keyColor}
        intensity={keyIntensity}
        position={[10, 18, -20]}
        distance={200}
        decay={1.2}
      />

      {/* Volumetric-style light shafts radiating from the key light. */}
      <group ref={shaftGroupRef} position={[10, 18, -20]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            rotation={[0, (Math.PI / 3) * i, 0]}
            position={[0, -10, 0]}
          >
            <planeGeometry args={[9, 30]} />
            <shaderMaterial
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              uniforms={shaftUniforms}
              vertexShader={LIGHT_SHAFT_VERTEX_SHADER}
              fragmentShader={LIGHT_SHAFT_FRAGMENT_SHADER}
            />
          </mesh>
        ))}
      </group>
    </>
  );
};
