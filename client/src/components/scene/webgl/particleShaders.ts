/**
 * GLSL shaders for the GPU-accelerated ambient particle field and
 * click-to-spawn burst effects used by the WebGL 3D scene renderer.
 *
 * All particle motion (drift, turbulence, gravity, twinkle, wraparound)
 * is computed entirely on the GPU inside the vertex shader so that
 * thousands of particles can be animated without any per-frame CPU work.
 */

export const AMBIENT_PARTICLE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uBoundsMinY;
  uniform float uBoundsMaxY;
  uniform float uGravity;
  uniform float uTurbulence;
  uniform vec3 uColor;
  uniform vec3 uColor2;

  attribute float aScale;
  attribute vec3 aRandom;
  attribute float aPhase;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec3 pos = position;
    float t = uTime * uSpeed;

    // GPU-computed turbulence: layered sine drift seeded per-particle so
    // every particle follows a unique, organic path without any CPU update.
    float driftX = sin(t * (0.35 + aRandom.x * 0.6) + aPhase) * uTurbulence;
    float driftZ = cos(t * (0.3 + aRandom.y * 0.6) + aPhase * 1.3) * uTurbulence;
    pos.x += driftX;
    pos.z += driftZ;

    // Gravity-driven vertical travel with seamless wraparound so particles
    // endlessly rise/fall within the scene bounds (physics-based movement).
    float range = uBoundsMaxY - uBoundsMinY;
    float fall = t * uGravity * (0.4 + aRandom.z * 0.8);
    float y = mod((pos.y - uBoundsMinY) - fall, range) + uBoundsMinY;
    pos.y = y;

    // Twinkle: per-particle pulsing alpha driven by a unique phase/frequency.
    float twinkle = 0.5 + 0.5 * sin(t * (1.5 + aRandom.x * 1.5) + aPhase * 2.0);
    vAlpha = mix(0.35, 1.0, twinkle);
    vColor = mix(uColor, uColor2, aRandom.y);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * aScale * uPixelRatio * (300.0 / max(-mvPosition.z, 1.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const AMBIENT_PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform float uOpacity;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord.xy - 0.5;
    float dist = length(uv);
    float alpha = smoothstep(0.5, 0.0, dist);
    if (alpha <= 0.01) discard;

    // Soft additive glow core for a "sparkle" look.
    float core = smoothstep(0.18, 0.0, dist);
    vec3 finalColor = vColor + core * 0.5;

    gl_FragColor = vec4(finalColor, alpha * vAlpha * uOpacity);
  }
`;

export const BURST_PARTICLE_VERTEX_SHADER = /* glsl */ `
  uniform float uElapsed;
  uniform float uDuration;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uGravity;

  attribute vec3 aVelocity;
  attribute float aScale;

  varying float vAlpha;

  void main() {
    float progress = clamp(uElapsed / uDuration, 0.0, 1.0);

    // Radial outward motion (physics-based: constant velocity + gravity pull).
    vec3 pos = position + aVelocity * uElapsed;
    pos.y -= 0.5 * uGravity * uElapsed * uElapsed;

    vAlpha = 1.0 - progress;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float shrink = mix(1.0, 0.2, progress);
    gl_PointSize = uSize * aScale * shrink * uPixelRatio * (300.0 / max(-mvPosition.z, 1.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const BURST_PARTICLE_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord.xy - 0.5;
    float dist = length(uv);
    float alpha = smoothstep(0.5, 0.0, dist);
    if (alpha <= 0.01) discard;

    gl_FragColor = vec4(uColor, alpha * vAlpha);
  }
`;

export const SKY_DOME_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const SKY_DOME_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  uniform float uOffset;
  uniform float uExponent;

  varying vec3 vWorldPosition;

  void main() {
    float h = normalize(vWorldPosition + uOffset).y;
    float factor = pow(max(h * 0.5 + 0.5, 0.0), uExponent);
    gl_FragColor = vec4(mix(uBottomColor, uTopColor, factor), 1.0);
  }
`;

export const LIGHT_SHAFT_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const LIGHT_SHAFT_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;

  varying vec2 vUv;

  void main() {
    // Soft vertical falloff plus a slow pulsing shimmer to emulate
    // volumetric light shafts without an expensive raymarch pass.
    float vertical = smoothstep(1.0, 0.0, vUv.y);
    float horizontal = smoothstep(0.5, 0.0, abs(vUv.x - 0.5));
    float shimmer = 0.85 + 0.15 * sin(uTime * 0.6 + vUv.y * 6.0);
    float alpha = vertical * horizontal * shimmer * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
