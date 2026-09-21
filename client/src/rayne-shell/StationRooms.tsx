import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import type { AmbientState } from './ambient';
import type { StationId } from './stations';

function Mat({
  color,
  roughness = 0.82,
  metalness = 0.08,
  emissive,
  emissiveIntensity = 0,
}: {
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissiveIntensity}
    />
  );
}

function Walls({
  floor,
  back,
  side,
  height = 3.6,
}: {
  floor: string;
  back: string;
  side: string;
  height?: number;
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <Mat color={floor} roughness={0.9} />
      </mesh>
      <mesh position={[0, height / 2, -3.2]} receiveShadow>
        <planeGeometry args={[10, height]} />
        <Mat color={back} roughness={0.92} />
      </mesh>
      <mesh position={[-3.4, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, height]} />
        <Mat color={side} roughness={0.92} />
      </mesh>
      <mesh position={[3.4, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10, height]} />
        <Mat color={side} roughness={0.92} />
      </mesh>
    </group>
  );
}

function Chair({
  position,
  rotationY = 0,
  color = '#6d6a66',
}: {
  position: [number, number, number];
  rotationY?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.55, 0.06, 0.52]} />
        <Mat color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.85, -0.2]}>
        <boxGeometry args={[0.55, 0.55, 0.06]} />
        <Mat color={color} roughness={0.7} />
      </mesh>
      {[
        [-0.22, 0.24, 0.2],
        [0.22, 0.24, 0.2],
        [-0.22, 0.24, -0.2],
        [0.22, 0.24, -0.2],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.012, 0.012, 0.48, 8]} />
          <Mat color="#1a1a1a" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function OutdoorWindow({
  position,
  size = [1.1, 2.1],
  ambient,
}: {
  position: [number, number, number];
  size?: [number, number];
  ambient: AmbientState;
}) {
  const rainRef = useRef<Group>(null);
  const flakes = useMemo(() => {
    const n =
      ambient.weather === 'snow' ? 28 : ambient.weather === 'rain' ? 36 : 0;
    return Array.from({ length: n }, (_, i) => ({
      x: (i % 7) * 0.14 - 0.42,
      y: (i * 0.17) % 1.8,
      z: 0.03,
      s: 0.015 + (i % 3) * 0.008,
      speed: 0.45 + (i % 5) * 0.12,
    }));
  }, [ambient.weather]);

  useFrame((_, dt) => {
    if (!rainRef.current || flakes.length === 0) return;
    rainRef.current.children.forEach((child, i) => {
      const f = flakes[i];
      if (!f) return;
      const fall = f.speed * dt * (ambient.weather === 'snow' ? 0.35 : 1.15);
      child.position.y -= fall;
      if (child.position.y < -size[1] * 0.45) child.position.y = size[1] * 0.45;
      if (ambient.weather === 'snow') {
        child.position.x =
          f.x + Math.sin(performance.now() * 0.001 + i) * 0.05;
      }
    });
  });

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[size[0] * 0.96, size[1] * 0.96]} />
        <meshBasicMaterial color={ambient.skyFar} />
      </mesh>
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[size[0] * 0.96, size[1] * 0.96]} />
        <meshBasicMaterial color={ambient.sky} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={size} />
        <meshStandardMaterial
          color="#1a2040"
          transparent
          opacity={0.2}
          emissive={ambient.sky}
          emissiveIntensity={ambient.timeOfDay === 'night' ? 0.12 : 0.32}
        />
      </mesh>
      <group ref={rainRef}>
        {flakes.map((f, i) => (
          <mesh key={i} position={[f.x, f.y - size[1] * 0.1, f.z]}>
            <boxGeometry
              args={[
                ambient.weather === 'rain' ? 0.008 : f.s,
                ambient.weather === 'rain' ? 0.055 : f.s,
                0.008,
              ]}
            />
            <meshBasicMaterial
              color={ambient.weather === 'snow' ? '#f2f6ff' : '#9eb4d0'}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function HomeRoom({ ambient }: { ambient: AmbientState }) {
  return (
    <group>
      <Walls floor="#7b6eae" back="#8a7bb8" side="#7a6aad" />
      <OutdoorWindow position={[-1.15, 2.15, -3.18]} ambient={ambient} />
      <OutdoorWindow position={[0.35, 2.15, -3.18]} ambient={ambient} />
      <mesh position={[0.55, 2.7, -3.16]}>
        <circleGeometry args={[0.09, 16]} />
        <meshBasicMaterial color="#f6e9a8" />
      </mesh>
      <mesh position={[2.4, 1.35, -3.15]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.12, 0.55, 6, 12]} />
        <Mat color="#1c1c22" roughness={0.4} />
      </mesh>
      <Chair position={[1.15, 0, -0.55]} rotationY={-0.55} />
      <mesh position={[-2.2, 1.85, -3.05]}>
        <boxGeometry args={[1.1, 0.05, 0.28]} />
        <Mat color="#c9b8e8" />
      </mesh>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#c9b8ff', '#4a3d70', 0.55]} />
      <spotLight
        position={[2.5, 4.2, 3]}
        angle={0.55}
        penumbra={0.8}
        intensity={2.6}
        color="#ffe6c7"
      />
      <pointLight position={[-1.2, 2.4, -2.6]} intensity={0.9} color="#9bb6ff" />
    </group>
  );
}

function WorkRoom({ ambient }: { ambient: AmbientState }) {
  return (
    <group>
      <Walls floor="#2a2622" back="#3a4452" side="#323844" />
      <mesh position={[0.85, 0.74, -1.05]}>
        <boxGeometry args={[2.05, 0.07, 0.78]} />
        <Mat color="#4a3728" roughness={0.55} />
      </mesh>
      {[
        [0.05, 0.37, -0.78],
        [1.65, 0.37, -0.78],
        [0.05, 0.37, -1.32],
        [1.65, 0.37, -1.32],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.07, 0.74, 0.07]} />
          <Mat color="#2a1f18" />
        </mesh>
      ))}
      <mesh position={[0.2, 1.28, -1.28]}>
        <boxGeometry args={[0.72, 0.48, 0.05]} />
        <Mat color="#111318" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0.2, 1.28, -1.255]}>
        <planeGeometry args={[0.64, 0.4]} />
        <meshStandardMaterial
          color="#0b1c22"
          emissive="#3de0ff"
          emissiveIntensity={0.55}
        />
      </mesh>
      <mesh position={[1.05, 1.28, -1.28]}>
        <boxGeometry args={[0.72, 0.48, 0.05]} />
        <Mat color="#111318" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[1.05, 1.28, -1.255]}>
        <planeGeometry args={[0.64, 0.4]} />
        <meshStandardMaterial
          color="#1a1020"
          emissive="#ff2d75"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0.62, 0.8, -0.88]}>
        <boxGeometry args={[0.42, 0.02, 0.16]} />
        <Mat color="#1c1c1c" />
      </mesh>
      <mesh position={[-0.05, 0.8, -0.82]}>
        <cylinderGeometry args={[0.045, 0.04, 0.08, 16]} />
        <Mat color="#5a2a22" />
      </mesh>
      <Chair position={[0.7, 0, -0.28]} rotationY={0.08} color="#2c3340" />
      <mesh position={[-2.15, 0.02, -1.4]}>
        <cylinderGeometry args={[0.16, 0.22, 0.04, 16]} />
        <Mat color="#1a1a1a" />
      </mesh>
      <mesh position={[-2.15, 0.55, -1.4]}>
        <cylinderGeometry args={[0.03, 0.03, 1.05, 8]} />
        <Mat color="#3a2a1c" />
      </mesh>
      <mesh position={[-2.15, 1.15, -1.4]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <Mat color="#2f6a3a" roughness={0.7} />
      </mesh>
      <OutdoorWindow
        position={[-2.4, 1.7, -3.15]}
        size={[1.4, 0.9]}
        ambient={ambient}
      />
      <ambientLight intensity={0.32} />
      <hemisphereLight args={['#9db7d4', '#1a1e24', 0.35]} />
      <spotLight
        position={[1.2, 3.6, 1.4]}
        angle={0.42}
        penumbra={0.65}
        intensity={2.8}
        color="#e8f2ff"
      />
      <pointLight position={[0.2, 1.4, -1.0]} intensity={0.7} color="#3de0ff" />
      <pointLight position={[1.05, 1.4, -1.0]} intensity={0.45} color="#ff2d75" />
    </group>
  );
}

function ChillRoom({ ambient }: { ambient: AmbientState }) {
  return (
    <group>
      <Walls floor="#3a2c26" back="#5c4438" side="#4a382f" />
      <mesh position={[-0.15, 0.01, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.55, 32]} />
        <Mat color="#5a3d32" roughness={0.95} />
      </mesh>
      <mesh position={[-0.9, 0.38, -0.85]}>
        <boxGeometry args={[2.2, 0.42, 0.85]} />
        <Mat color="#6b5348" roughness={0.78} />
      </mesh>
      <mesh position={[-0.9, 0.72, -1.18]}>
        <boxGeometry args={[2.2, 0.55, 0.22]} />
        <Mat color="#7a5e50" roughness={0.78} />
      </mesh>
      <mesh position={[-1.55, 0.55, 0.15]}>
        <boxGeometry args={[0.22, 0.7, 1.15]} />
        <Mat color="#6b5348" />
      </mesh>
      <mesh position={[-0.4, 0.48, -0.7]}>
        <boxGeometry args={[0.32, 0.14, 0.28]} />
        <Mat color="#8a3d55" />
      </mesh>
      <mesh position={[0.15, 0.32, 0.35]}>
        <cylinderGeometry args={[0.38, 0.4, 0.08, 24]} />
        <Mat color="#2a211c" />
      </mesh>
      <mesh position={[1.55, 0.02, -0.4]}>
        <cylinderGeometry args={[0.08, 0.12, 0.04, 12]} />
        <Mat color="#1a1a1a" />
      </mesh>
      <mesh position={[1.55, 0.85, -0.4]}>
        <cylinderGeometry args={[0.025, 0.025, 1.7, 8]} />
        <Mat color="#2a2420" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[1.55, 1.72, -0.4]}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial
          color="#ffd4a8"
          emissive="#ffb060"
          emissiveIntensity={0.85}
        />
      </mesh>
      <OutdoorWindow
        position={[1.9, 1.85, -3.18]}
        size={[1.6, 1.8]}
        ambient={ambient}
      />
      <ambientLight intensity={0.28} />
      <hemisphereLight args={['#ffd8b0', '#2a1810', 0.4]} />
      <pointLight position={[1.55, 1.7, -0.2]} intensity={1.6} color="#ffb060" />
      <spotLight
        position={[-1.2, 3.4, 2.2]}
        angle={0.7}
        penumbra={0.9}
        intensity={1.1}
        color="#ffc8a0"
      />
    </group>
  );
}

function VideoRoom({ screenOn }: { screenOn: boolean }) {
  return (
    <group>
      <Walls floor="#14141a" back="#101014" side="#16161c" />
      <mesh position={[0, 1.55, -3.12]}>
        <boxGeometry args={[2.7, 1.55, 0.08]} />
        <Mat color="#0a0a0c" metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.55, -3.07]}>
        <planeGeometry args={[2.46, 1.34]} />
        <meshStandardMaterial
          color={screenOn ? '#102030' : '#050508'}
          emissive={screenOn ? '#3a6aa8' : '#101018'}
          emissiveIntensity={screenOn ? 0.7 : 0.12}
        />
      </mesh>
      <mesh position={[0, 0.42, -2.85]}>
        <boxGeometry args={[2.4, 0.42, 0.42]} />
        <Mat color="#1c1c22" />
      </mesh>
      <mesh position={[0, 0.36, 1.15]}>
        <boxGeometry args={[2.4, 0.38, 0.7]} />
        <Mat color="#2a2a32" />
      </mesh>
      <mesh position={[0, 0.7, 1.4]}>
        <boxGeometry args={[2.4, 0.42, 0.18]} />
        <Mat color="#32323c" />
      </mesh>
      <mesh position={[0, 2.55, -3.05]}>
        <boxGeometry args={[2.5, 0.04, 0.08]} />
        <meshBasicMaterial color={screenOn ? '#6ad0ff' : '#2a3040'} />
      </mesh>
      <ambientLight intensity={screenOn ? 0.16 : 0.12} />
      <hemisphereLight args={['#4a6080', '#08080c', 0.22]} />
      <pointLight
        position={[0, 1.6, -2.4]}
        intensity={screenOn ? 1.4 : 0.25}
        color="#6aa4ff"
      />
      <spotLight
        position={[2.2, 3.4, 2]}
        angle={0.5}
        penumbra={0.85}
        intensity={0.55}
        color="#ffe6d0"
      />
    </group>
  );
}

function StudioRoom() {
  return (
    <group>
      <Walls floor="#3a3a40" back="#2a2433" side="#26202c" />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 40]} />
        <Mat color="#2a2a30" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[-1.7, 1.35, -3.12]}>
        <planeGeometry args={[0.9, 1.15]} />
        <Mat color="#1a1020" emissive="#ff2d75" emissiveIntensity={0.28} />
      </mesh>
      <mesh position={[0.05, 1.45, -3.12]}>
        <planeGeometry args={[0.7, 0.9]} />
        <Mat color="#101820" emissive="#00f7ff" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[1.85, 0.95, -1.1]} rotation={[0, -0.35, 0]}>
        <boxGeometry args={[0.04, 1.5, 0.04]} />
        <Mat color="#1a1a1a" />
      </mesh>
      <mesh position={[1.85, 1.35, -1.02]} rotation={[0, -0.35, 0]}>
        <boxGeometry args={[0.55, 0.72, 0.03]} />
        <Mat color="#f2ece4" />
      </mesh>
      <mesh position={[-2.2, 2.4, 0]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[1.6, 0.03, 0.03]} />
        <meshBasicMaterial color="#ff2d75" />
      </mesh>
      <mesh position={[2.2, 2.5, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[1.4, 0.03, 0.03]} />
        <meshBasicMaterial color="#00f7ff" />
      </mesh>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffb0d0', '#1a1020', 0.4]} />
      <spotLight
        position={[0, 4.2, 2.2]}
        angle={0.55}
        penumbra={0.5}
        intensity={2.4}
        color="#fff4e8"
      />
      <pointLight position={[-1.6, 1.5, -2.4]} intensity={0.7} color="#ff2d75" />
      <pointLight position={[0.2, 1.6, -2.4]} intensity={0.55} color="#00f7ff" />
    </group>
  );
}

export default function StationEnvironment({
  station,
  screenOn,
  ambient,
}: {
  station: StationId;
  screenOn: boolean;
  ambient: AmbientState;
}) {
  switch (station) {
    case 'work':
      return <WorkRoom ambient={ambient} />;
    case 'chill':
      return <ChillRoom ambient={ambient} />;
    case 'video':
      return <VideoRoom screenOn={screenOn} />;
    case 'studio':
      return <StudioRoom />;
    default:
      return <HomeRoom ambient={ambient} />;
  }
}
