# Cyber-Romantic UI Components

This document describes the new cyber-romantic themed UI components added to the Milla-Rayne project.

## Overview

The implementation adds a complete set of immersive, cyber-romantic themed UI components with:
- **Glow effects** for visual appeal
- **Focus-visible states** for accessibility
- **Responsive design** that adapts from mobile to desktop
- **High-contrast text** on dark backgrounds for readability
- **Tactile feedback** on interactive elements

## Components

### AppShell

A minimal wrapper component that preserves existing routes and functionality.

```tsx
import AppShell from '@/AppShell';

function App() {
  return (
    <AppShell>
      {/* Your existing app content */}
    </AppShell>
  );
}
```

**Props:** None (just accepts `children`)

---

### Header

A sticky navigation header with branding and navigation links.

```tsx
import Header from '@/components/Header';

<Header />
```

**Features:**
- Sticky positioning
- Responsive navigation (collapses to hamburger on mobile)
- Cyber-romantic styling with backdrop blur
- Focus-visible states on all links

---

### Hero

A full-screen hero section with animated backgrounds and feature highlights.

```tsx
import Hero from '@/components/Hero';

<Hero />
```

**Features:**
- Full-screen, responsive layout
- Animated background effects
- Feature cards grid (responsive: 1 column on mobile, 3 on desktop)
- Scroll indicator
- High-contrast text with glow effects

---

### GlowButton

Themed button component with customizable glow effects.

```tsx
import GlowButton from '@/components/GlowButton';

<GlowButton variant="pink" size="lg" glow={true}>
  Click Me
</GlowButton>
```

**Props:**
- `variant`: `'pink' | 'blue' | 'purple' | 'default'` (default: `'pink'`)
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `glow`: `boolean` (default: `true`) - Enable/disable glow effect
- All standard button HTML attributes

**Features:**
- Multiple color variants with gradient backgrounds
- Glow shadow effects
- Tactile feedback (scale down on press)
- Focus-visible ring state
- Hover animations

---

### Card Components

Themed card containers with optional glow effects.

```tsx
import Card, { 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/Card';

<Card glow animated>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Your content */}
  </CardContent>
  <CardFooter>
    {/* Footer content */}
  </CardFooter>
</Card>
```

**Card Props:**
- `glow`: `boolean` (default: `false`) - Enable hover glow effect
- `animated`: `boolean` (default: `false`) - Enable animated background

**Features:**
- Backdrop blur effect
- Border glow on hover (when `glow` is enabled)
- Animated background gradient (when `animated` is enabled)
- High-contrast title with glow effect
- Responsive padding and spacing

---

### Form Controls

Themed form input components with focus states and glow effects.

```tsx
import { Input, Textarea, Label, Checkbox, Select } from '@/components/FormControls';

<div>
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="Enter email"
    glow={true}
  />
</div>

<div>
  <Label htmlFor="message">Message</Label>
  <Textarea 
    id="message"
    placeholder="Your message"
    rows={5}
  />
</div>

<div className="flex items-center space-x-2">
  <Checkbox id="agree" />
  <Label htmlFor="agree">I agree</Label>
</div>

<Select>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>
```

**Common Props:**
- `glow`: `boolean` (default: `true`) - Enable glow effect on focus
- All standard HTML input attributes

**Features:**
- Focus-visible ring states with cyber-pink accent
- Glow effect on focus
- High-contrast text on dark backgrounds
- Consistent styling across all form elements
- Tactile feedback

---

### Landing Page

A complete landing page showcasing all components.

```tsx
import Landing from '@/pages/Landing';

<Landing />
```

**Features:**
- Full landing page experience
- Responsive sections (Hero, Features, About, Contact)
- Grid layouts that collapse on mobile
- Footer with branding
- Integration of all components

---

## Styling

### Tailwind Theme Extensions

The `tailwind.config.ts` has been extended with:

#### Colors
- `cyber-pink`: `#ff2a6d`
- `cyber-purple`: `#7c3aed`
- `cyber-blue`: `#05d9e8`
- `cyber-dark`: `#0f0f1a`
- `cyber-darker`: `#05070d`
- `neon-pink`, `neon-blue`, `neon-purple`, `neon-green`

#### Background Images
- `bg-gradient-radial`: Radial gradient
- `bg-gradient-conic`: Conic gradient
- `bg-cyber-grid`: Cyber-themed grid pattern
- `bg-glow-gradient`: Radial glow gradient

#### Box Shadows
- `shadow-glow-sm`, `shadow-glow-md`, `shadow-glow-lg`, `shadow-glow-xl`
- `shadow-neon-pink`, `shadow-neon-blue`

#### Animations
- `animate-glow-pulse`: Pulsing glow effect
- `animate-float-up`: Floating upward animation
- `animate-shimmer`: Shimmer effect

#### Font Families
- Extended with fallbacks: Inter, Fira Code, etc.

### CSS Utility Classes (glow.css)

Custom utility classes are available in `client/src/styles/glow.css`:

#### Text Glow
- `.glow-text`: Standard text glow
- `.glow-text-sm`: Small text glow
- `.glow-text-lg`: Large text glow

#### Interactive Effects
- `.glow-hover`: Hover glow effect
- `.focus-glow`: Focus-visible glow effect
- `.tactile`: Tactile feedback on press

#### Button Styles
- `.btn-glow-pink`: Pink gradient button with glow
- `.btn-glow-blue`: Blue gradient button with glow

#### Card Styles
- `.card-glow`: Card with glow border and hover effect

#### Input Styles
- `.input-glow`: Input field with glow on focus

#### Animations
- `.glow-pulse`: Pulsing glow animation
- `.bg-glow-animated`: Animated rotating glow background
- `.shimmer`: Shimmer loading effect

#### Utility
- `.text-high-contrast`: High-contrast white text with shadow

---

## Accessibility

All components include proper accessibility features:

1. **Focus-visible states**: All interactive elements have visible focus rings
2. **High-contrast text**: Text is legible on dark backgrounds
3. **Keyboard navigation**: All components work with keyboard
4. **Semantic HTML**: Proper use of semantic elements
5. **ARIA labels**: Where appropriate (e.g., mobile menu button)

---

## Responsive Design

All components are fully responsive:

- **Hero**: Full-bleed on all screens, content centers
- **Feature grids**: 
  - Mobile: 1 column
  - Tablet (md): 2 columns
  - Desktop (lg): 3 columns
- **Header**: Collapses to hamburger menu on mobile
- **Forms**: Full-width on mobile, constrained on desktop
- **Cards**: Stack on mobile, grid on desktop

---

## Usage Examples

See `client/src/ComponentExamples.tsx` for comprehensive usage examples.

### Quick Start

1. **Use the Landing page** as a standalone page:
   ```tsx
   import Landing from '@/pages/Landing';
   
   // Render as a route or standalone page
   <Landing />
   ```

2. **Use individual components** in your app:
   ```tsx
   import GlowButton from '@/components/GlowButton';
   import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
   
   function MyComponent() {
     return (
       <Card glow>
         <CardHeader>
           <CardTitle>My Card</CardTitle>
         </CardHeader>
         <CardContent>
           <p>Content here</p>
           <GlowButton variant="pink">Click Me</GlowButton>
         </CardContent>
       </Card>
     );
   }
   ```

3. **Use CSS utilities** for custom styling:
   ```tsx
   <div className="card-glow p-6 rounded-lg">
     <h2 className="glow-text text-cyber-pink">Glowing Title</h2>
     <button className="btn-glow-pink tactile">
       Custom Button
     </button>
   </div>
   ```

---

## Integration with Existing App

The `AppShell` component is designed to wrap existing content without breaking functionality:

```tsx
// In your main App.tsx or equivalent
import AppShell from '@/AppShell';
import YourExistingApp from './YourExistingApp';

function App() {
  return (
    <AppShell>
      <YourExistingApp />
    </AppShell>
  );
}
```

This preserves:
- All existing routes
- Navigation
- State management
- WebSocket connections
- Any other app functionality

---

## Browser Compatibility

The components use modern CSS features:
- CSS Grid and Flexbox
- CSS Custom Properties (CSS variables)
- backdrop-filter (with fallbacks)
- CSS animations

Supported browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance Considerations

1. **Animations**: Animations use `transform` and `opacity` for optimal performance
2. **Backdrop blur**: Applied sparingly for performance
3. **Glow effects**: Box shadows are hardware-accelerated where possible
4. **Responsive images**: Consider using appropriate image sizes for different screen sizes

---

## Customization

### Changing Colors

Modify `tailwind.config.ts`:

```typescript
colors: {
  cyber: {
    pink: '#your-color',
    purple: '#your-color',
    // etc.
  }
}
```

### Changing Glow Intensity

Modify `glow.css` shadow values:

```css
.glow-hover:hover {
  box-shadow: 0 0 20px rgba(255, 42, 109, 0.6), 
              0 0 40px rgba(124, 58, 237, 0.3);
}
```

### Adding New Variants

Extend component props and styles:

```tsx
// In GlowButton.tsx
const variantStyles = {
  // ... existing variants
  green: 'bg-gradient-to-br from-green-500 to-green-700 ...',
};
```

---

## Troubleshooting

### Components not rendering with styles

1. Ensure `glow.css` is imported in `index.css`
2. Check that Tailwind config includes the correct content paths
3. Rebuild the application: `npm run build`

### Focus states not visible

1. Ensure you're using keyboard navigation (Tab key)
2. Check browser devtools for `:focus-visible` styles
3. Verify focus-visible styles in `glow.css`

### Responsive layout not working

1. Test in browser devtools responsive mode
2. Verify Tailwind breakpoint classes (sm, md, lg)
3. Check container padding on mobile

---

## Future Enhancements

Potential improvements:
- Dark/light theme toggle
- More color variants
- Accessibility audit with automated testing
- Animation performance profiling
- Additional form components (date pickers, etc.)
- Theme customization UI

---

## Contributing

When adding new components:
1. Follow the existing component structure
2. Include focus-visible states
3. Ensure responsive behavior
4. Add examples to `ComponentExamples.tsx`
5. Update this documentation

---

## License

These components are part of the Milla-Rayne project and follow the project's license.
