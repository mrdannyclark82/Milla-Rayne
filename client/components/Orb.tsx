import { Canvas } from '@react-three/fiber';

export default function Orb() {
  return (
    <Canvas>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial emissive="cyan" emissiveIntensity={0.8} />
      </mesh>
    </Canvas>
  );
}