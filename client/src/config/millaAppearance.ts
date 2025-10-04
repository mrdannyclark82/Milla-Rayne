/**
 * Milla's appearance configuration
 * Defines visual character tokens for consistent rendering
 */

export interface MillaAppearanceTokens {
  eyes: {
    color: string;
    highlight: string;
  };
  hair: {
    color: string;
    highlight: string;
    description: string;
  };
  skin: {
    base: string;
    freckles: string;
    description: string;
  };
  wardrobe: {
    primary: string;
    secondary: string;
    description: string;
  };
}

/**
 * Milla's canonical appearance
 * Eyes: green
 * Hair: deep copper red, long, naturally curly with volume
 * Skin: fair with light freckles
 * Wardrobe: cozy knit style (sand/olive)
 */
export const millaAppearance: MillaAppearanceTokens = {
  eyes: {
    color: '#2d8659', // Green eyes
    highlight: '#4ade80'
  },
  hair: {
    color: '#8b3a2e', // Deep copper red
    highlight: '#b85742',
    description: 'long, naturally curly with volume'
  },
  skin: {
    base: '#f5dcc8', // Fair
    freckles: '#d4a17a',
    description: 'fair with light freckles'
  },
  wardrobe: {
    primary: '#c9b896', // Sand
    secondary: '#6b7c5d', // Olive
    description: 'cozy knit style'
  }
};

/**
 * Time-of-day tints for subtle atmosphere
 * Applied as overlay/filter on the visual
 */
export const timeOfDayTints = {
  dawn: 'rgba(255, 200, 150, 0.15)', // Warm peachy glow
  day: 'rgba(255, 255, 240, 0.05)',   // Neutral, very subtle
  dusk: 'rgba(255, 140, 100, 0.2)',   // Golden hour
  night: 'rgba(100, 120, 180, 0.2)'   // Cool moonlight
};
