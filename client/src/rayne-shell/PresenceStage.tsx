import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import {
  Box3,
  Vector3,
  type Group,
  type Object3D,
  type PerspectiveCamera,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { AmbientState } from './ambient';
import StationEnvironment from './StationRooms';
import { STATIONS, type StationId, type OrbitPose } from './stations';

type Orbit = OrbitPose;

const AVATARS = [
  { id: 'body', url: '/models/milla-body.glb', label: 'Milla', height: 1.68 },
] as const;

function CameraOrbit({
  targetX,
  targetY,
  targetZ,
  orbit,
}: {
  targetX: number;
  targetY: number;
  targetZ: number;
  orbit: MutableRefObject<Orbit>;
}) {
  const { camera } = useThree();
  useFrame(() => {
    const { theta, phi, r } = orbit.current;
    const x = targetX + Math.sin(theta) * Math.cos(phi) * r;
    const y = targetY + Math.sin(phi) * r * 0.9;
    const z = targetZ + Math.cos(theta) * Math.cos(phi) * r;
    camera.position.set(x, y, z);
    (camera as PerspectiveCamera).lookAt(targetX, targetY, targetZ);
  });
  return null;
}

function fitOnFloor(root: Object3D, targetHeight = 1.68) {
  const box = new Box3().setFromObject(root);
  const size = new Vector3();
  box.getSize(size);
  const h = Math.max(size.y, 0.001);
  root.scale.setScalar(targetHeight / h);
  const fitted = new Box3().setFromObject(root);
  const center = new Vector3();
  fitted.getCenter(center);
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= fitted.min.y;
}

function GltfMilla({
  url,
  height,
  speaking,
}: {
  url: string;
  height: number;
  speaking: boolean;
}) {
  const gltf = useLoader(GLTFLoader, url);
  const wrap = useRef<Group>(null);

  useLayoutEffect(() => {
    if (!wrap.current) return;
    wrap.current.clear();
    const scene = gltf.scene.clone(true);
    scene.traverse((obj) => {
      const mesh = obj as unknown as { isMesh?: boolean; castShadow?: boolean };
      if (mesh.isMesh) mesh.castShadow = true;
    });
    wrap.current.add(scene);
    fitOnFloor(wrap.current, height);
  }, [gltf, url, height]);

  useFrame(() => {
    if (!wrap.current) return;
    wrap.current.traverse((obj) => {
      const mat = (obj as unknown as { material?: { emissiveIntensity?: number } })
        .material;
      if (mat && typeof mat.emissiveIntensity === 'number') {
        mat.emissiveIntensity = speaking ? 0.18 : 0.02;
      }
    });
  });

  return <group ref={wrap} />;
}

function PublicOutfit({ bust }: { bust: boolean }) {
  // Shoulder-wider-than-hem (was inverted / “upside down” before).
  const knit = '#2a333b';
  if (bust) {
    return (
      <group>
        <mesh position={[0, 0.46, 0.02]}>
          <cylinderGeometry args={[0.26, 0.21, 0.5, 24]} />
          <meshStandardMaterial color={knit} roughness={0.72} />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      {/* torso — wider at shoulders */}
      <mesh position={[0, 1.2, 0.02]}>
        <cylinderGeometry args={[0.28, 0.22, 0.64, 28]} />
        <meshStandardMaterial color={knit} roughness={0.7} />
      </mesh>
      {/* skirt / hem */}
      <mesh position={[0, 0.79, 0.02]}>
        <cylinderGeometry args={[0.23, 0.29, 0.29, 28]} />
        <meshStandardMaterial color={knit} roughness={0.72} />
      </mesh>
      <mesh position={[-0.31, 1.24, 0.02]} rotation={[0, 0, 0.55]}>
        <cylinderGeometry args={[0.057, 0.05, 0.43, 12]} />
        <meshStandardMaterial color={knit} roughness={0.7} />
      </mesh>
      <mesh position={[0.31, 1.24, 0.02]} rotation={[0, 0, -0.55]}>
        <cylinderGeometry args={[0.057, 0.05, 0.43, 12]} />
        <meshStandardMaterial color={knit} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Idle({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.35) * 0.01;
  });
  return <group ref={ref}>{children}</group>;
}

export default function PresenceStage({
  speaking,
  station,
  screenOn,
  ambient,
}: {
  speaking: boolean;
  station: StationId;
  screenOn: boolean;
  ambient: AmbientState;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const def = STATIONS[station];
  const orbit = useRef<Orbit>({ ...def.orbit });
  const [avatar, setAvatar] = useState<(typeof AVATARS)[number]>(AVATARS[0]);
  const [clothed, setClothed] = useState(true);
  const lookY = def.lookY;

  useEffect(() => {
    orbit.current = { ...STATIONS[station].orbit };
  }, [station]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const drag = { on: false, x: 0, y: 0 };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement | null)?.closest?.('button')) return;
      drag.on = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag.on) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      orbit.current.theta -= dx * 0.008;
      orbit.current.phi += dy * 0.0055;
      orbit.current.phi = Math.max(-0.12, Math.min(0.55, orbit.current.phi));
    };
    const up = () => {
      drag.on = false;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      orbit.current.r = Math.max(
        2.2,
        Math.min(7.5, orbit.current.r + e.deltaY * 0.004)
      );
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('wheel', wheel);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      className="rs-presence"
      aria-label={`Milla ${def.where} — drag to orbit`}
      style={{ touchAction: 'none', background: def.bg }}
    >
      <Canvas
        camera={{ position: [0.7, 1.4, 3.8], fov: 38 }}
        eventSource={boxRef as any}
        eventPrefix="client"
        gl={{
          antialias: true,
          failIfMajorPerformanceCaveat: false,
          powerPreference: 'default',
        }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={[def.bg]} />
        <fog attach="fog" args={[def.bg, def.fogNear, def.fogFar]} />
        <Suspense fallback={null}>
          <StationEnvironment
            key={station}
            station={station}
            screenOn={screenOn}
            ambient={ambient}
          />
          <group position={def.avatar}>
            <Idle>
              <GltfMilla url={avatar.url} height={avatar.height} speaking={speaking} />
            </Idle>
          </group>
        </Suspense>
        <CameraOrbit
          targetX={def.avatar[0]}
          targetY={lookY}
          targetZ={def.avatar[2]}
          orbit={orbit}
        />
      </Canvas>
    </div>
  );
}
