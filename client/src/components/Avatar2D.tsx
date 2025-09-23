import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Avatar2DProps {
  imageUrl: string;
  avatarState: 'neutral' | 'thinking' | 'responding';
}

const Avatar: React.FC<Avatar2DProps> = ({ imageUrl, avatarState }) => {
  const mesh = useRef<THREE.Mesh>(null!);
  const texture = useTexture(imageUrl);

  useFrame(() => {
    if (mesh.current) {
      if (avatarState === 'thinking') {
        mesh.current.rotation.y += 0.01;
      } else if (avatarState === 'responding') {
        mesh.current.rotation.x += 0.01;
      }
    }
  });

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[5, 5]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
};

const Avatar2D: React.FC<Avatar2DProps> = ({ imageUrl, avatarState }) => {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Avatar imageUrl={imageUrl} avatarState={avatarState} />
    </Canvas>
  );
};

export default Avatar2D;
