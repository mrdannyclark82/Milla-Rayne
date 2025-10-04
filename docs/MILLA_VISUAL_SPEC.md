# Milla Visual Specification

## Character Sheet

### Physical Appearance

**Eyes**: Green (`#2d8659`)
- Bright, expressive green eyes with highlights
- Glowing effect that intensifies based on state

**Hair**: Deep copper red (`#8b3a2e`)
- Long, naturally curly with volume
- Full, flowing curls framing the face
- Highlights in lighter copper tones

**Skin**: Fair with light freckles (`#f5dcc8`)
- Fair complexion
- Subtle freckles across cheeks and nose
- Natural, warm undertones

**Wardrobe**: Cozy knit style
- Primary: Sand/beige tones (`#c9b896`)
- Secondary: Olive/earthy greens (`#6b7c5d`)
- Comfortable, relaxed aesthetic

## Visual States

### Idle
- Gentle breathing animation (subtle rise/fall)
- Eyes with soft glow
- Relaxed posture
- Minimal motion (respects reduced-motion)

### Listening
- Slightly brighter appearance (filter: brightness 1.1)
- Enhanced eye glow
- Subtle pulsing animation (2s cycle)
- Attentive posture
- **Reduced-motion**: brightness change only

### Speaking
- Brightest appearance (filter: brightness 1.15)
- Maximum eye glow
- Active pulsing animation (1s cycle)
- Engaged posture
- **Reduced-motion**: brightness change only

## Framing Modes

### Full (Default)
- Head-to-toe view
- Preferred when vertical space allows
- Shows complete character
- Anchored at bottom of viewport
- ViewBox: `0 0 200 400`

### Torso
- Head and upper body
- For constrained layouts
- Centered vertically
- ViewBox: `0 0 200 250`

## Time-of-Day Tints

Subtle atmospheric overlays synchronized with AdaptiveSceneManager:

- **Dawn**: Warm peachy glow (`rgba(255, 200, 150, 0.15)`)
- **Day**: Neutral, very subtle (`rgba(255, 255, 240, 0.05)`)
- **Dusk**: Golden hour (`rgba(255, 140, 100, 0.2)`)
- **Night**: Cool moonlight (`rgba(100, 120, 180, 0.2)`)

## Layering and Layout

### Z-Index Stack
```
Chat/Controls:        z-0 and above
Milla Stage:          z-5 (RPStageAnchor)
Adaptive Background:  z-10 (left 2/3 region)
```

### Viewport Layout
```
┌─────────────────────────────┬──────────────┐
│                             │              │
│  Milla Visual Stage         │    Chat      │
│  (left 2/3)                 │  (right 1/3) │
│  - Background at z-10       │              │
│  - Stage at z-5             │              │
│                             │              │
│                             │              │
└─────────────────────────────┴──────────────┘
        66.6667vw                 33.3333vw
```

### Background Region Support

The adaptive background is clipped to the left 2/3:
- `region='left-2-3'` prop on AdaptiveSceneManager
- CSSSceneRenderer applies appropriate clipping
- Background remains at z-10
- Stage (with visual) at z-5
- Chat remains at z-0+ on the right

## Accessibility

- `aria-hidden="true"` on stage anchor
- `pointer-events: none` - no interaction blocking
- Reduced-motion: disable animations, use fade/brightness only
- No impact on keyboard navigation or screen readers

## Performance

- SVG-based rendering (lightweight, scalable)
- CSS transforms and opacity only (GPU-accelerated)
- Target: 60fps on desktop
- Smooth on Android Chrome
- No input latency regressions

## Implementation Files

- **Stage**: `client/src/components/rp/RPStageAnchor.tsx`
- **Visual**: `client/src/components/rp/placeholders/MillaSilhouette.tsx`
- **Config**: `client/src/config/millaAppearance.ts`
- **Background**: Modified `client/src/components/scene/CSSSceneRenderer.tsx`
- **Manager**: Modified `client/src/components/scene/AdaptiveSceneManager.tsx`

## Integration

Mount in App.tsx after AdaptiveSceneManager:

```tsx
<AdaptiveSceneManager 
  region="left-2-3"
  // ... other props
/>

<RPStageAnchor>
  <MillaSilhouette
    state={visualState}
    timeOfDay={currentTimeOfDay}
    framing="full"
    reducedMotion={prefersReducedMotion}
  />
</RPStageAnchor>
```

State wiring:
- `listening`: from MobileVoiceControls press-hold
- `speaking`: from VoiceControls `isSpeaking` prop
- `idle`: default state

## Future Enhancements

This placeholder visual is designed to be replaced or augmented with:
- More detailed artwork
- Additional animations
- Expression variations
- Gesture support
- Avatar customization options

The architecture supports these enhancements without breaking changes to the layout or state management.
