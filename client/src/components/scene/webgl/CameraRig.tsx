import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraRigProps {
  enabled: boolean;
  intensity?: number;
}

/**
 * Subtle camera parallax driven by pointer position — an "interactive
 * element" for the background scene (camera responds to the user) without
 * a full orbit-control rig, which would be too invasive for a chat
 * background.
 */
export function CameraRig({ enabled, intensity = 1.2 }: CameraRigProps) {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!enabled) return;

    const targetX = pointer.x * intensity;
    const targetY = pointer.y * intensity * 0.6 + 2;

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      targetX,
      Math.min(1, delta * 1.5)
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      targetY,
      Math.min(1, delta * 1.5)
    );

    target.current.set(0, 0, -30);
    camera.lookAt(target.current);
  });

  return null;
}
