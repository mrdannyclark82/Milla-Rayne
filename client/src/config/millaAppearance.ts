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
 * Wardrobe Outfit Palettes
 * Defines specific color themes for different attire styles
 */
export const outfitPalettes = {
  casual: {
    primary: '#f0e0c8', // Warm sand
    secondary: '#a8ba98', // Sage green
    description: 'cozy knit style',
  },
  elegant: {
    primary: '#e2d1f9', // Pastel lavender
    secondary: '#1d3557', // Rich deep royal navy
    description: 'elegant evening dress style',
  },
  professional: {
    primary: '#2b2d42', // Charcoal/navy structured blazer
    secondary: '#edf2f4', // Crisp satin white collar
    description: 'tailored corporate professional attire',
  },
  intimate: {
    primary: '#d63031', // Crimson rose red silk
    secondary: '#2d3436', // Delicate midnight charcoal lace trim
    description: 'alluring rose-red silk loungewear',
  },
};

/**
 * Milla's canonical appearance
 * Eyes: green
 * Hair: deep copper red, long, naturally curly with volume
 * Skin: fair with light freckles
 * Wardrobe: cozy knit style (sand/olive)
 */
export const millaAppearance: MillaAppearanceTokens = {
  eyes: {
    color: '#4ade80', // Bright vibrant green eyes
    highlight: '#6ee7a7',
  },
  hair: {
    color: '#e89580', // Bright peachy copper
    highlight: '#f5b5a0',
    description: 'long, naturally curly with volume',
  },
  skin: {
    base: '#fff5eb', // Very light warm ivory
    freckles: '#daa77a',
    description: 'fair with light freckles',
  },
  wardrobe: outfitPalettes.casual,
};

/**
 * Time-of-day tints for subtle atmosphere
 * Applied as overlay/filter on the visual
 */
export const timeOfDayTints = {
  dawn: 'rgba(255, 200, 150, 0.15)', // Warm peachy glow
  day: 'rgba(255, 255, 240, 0.05)', // Neutral, very subtle
  dusk: 'rgba(255, 140, 100, 0.2)', // Golden hour
  night: 'rgba(100, 120, 180, 0.2)', // Cool moonlight
};
