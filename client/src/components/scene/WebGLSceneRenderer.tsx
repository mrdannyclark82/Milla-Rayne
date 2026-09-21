import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { SceneConfig, SceneMood, TimeOfDay } from '@/types/scene';
import { SceneContent } from './webgl/SceneContent';

interface WebGLSceneRendererProps {
  config: SceneConfig;
  timeOfDay: TimeOfDay;
  mood: SceneMood;
  particleDensity: 'off' | 'low' | 'medium' | 'high';
  animationSpeed?: number;
  interactive?: boolean;
  region?: 'full' | 'left-2-3';
  /** Called if WebGL rendering fails at runtime so the caller can fall back. */
  onError?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches runtime failures from the Three.js/WebGL render tree (e.g. a
 * context creation failure on an unexpectedly unsupported device) and
 * notifies the parent so it can fall back to the CSS renderer instead of
 * crashing the whole app.
 */
class WebGLErrorBoundary extends React.Component<
  { onError?: () => void; children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { onError?: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('WebGL scene renderer failed, falling back:', error);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

/**
 * Option 2 renderer from the scene system design notes: a Three.js/WebGL
 * 3D scene generator with a procedural sky, dynamic lighting, and a
 * GPU-accelerated physics-based particle system, layered behind the chat
 * UI as an immersive animated background.
 */
export const WebGLSceneRenderer: React.FC<WebGLSceneRendererProps> = ({
  config,
  timeOfDay,
  mood,
  particleDensity,
  animationSpeed = 1.0,
  interactive = true,
  region = 'full',
  onError,
}) => {
  const regionStyle: React.CSSProperties =
    region === 'left-2-3'
      ? {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '66.6667vw',
          height: '100vh',
          zIndex: -10,
          overflow: 'hidden',
        }
      : {
          position: 'fixed',
          inset: 0,
          zIndex: -10,
        };

  return (
    <div
      style={{ ...regionStyle, pointerEvents: interactive ? 'auto' : 'none' }}
      aria-hidden="true"
      role="presentation"
    >
      <WebGLErrorBoundary onError={onError}>
        <Suspense fallback={null}>
          <Canvas
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
            }}
            camera={{ position: [0, 2, 40], fov: 60, near: 0.1, far: 600 }}
            onCreated={({ gl }) => {
              const canvasEl = gl.domElement;
              canvasEl.addEventListener(
                'webglcontextlost',
                (event) => {
                  event.preventDefault();
                  onError?.();
                },
                { once: true }
              );
            }}
          >
            <SceneContent
              colors={config.colors}
              particles={config.particles}
              particleDensity={particleDensity}
              timeOfDay={timeOfDay}
              mood={mood}
              animationSpeed={animationSpeed}
              interactive={interactive}
            />
          </Canvas>
        </Suspense>
      </WebGLErrorBoundary>
    </div>
  );
};
