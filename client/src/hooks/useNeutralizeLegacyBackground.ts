import { useEffect } from 'react';

/**
 * useNeutralizeLegacyBackground - One-time hook to neutralize legacy background images
 *
 * Scans the DOM on mount for elements with background-image or <img> tags that:
 * 1. Are positioned in the left 2/3 of the viewport
 * 2. Have URLs matching legacy background names (e.g., "milla_new")
 *
 * Neutralizes them by setting background to none/transparent or hiding the element.
 * Safe to no-op if no legacy backgrounds are found.
 */
export function useNeutralizeLegacyBackground(): void {
  useEffect(() => {
    // Legacy background patterns to look for
    const legacyPatterns = [
      'milla_new',
      'milla-new',
      'background',
      'bg-image',
      'avatar-bg',
    ];

    // Get the left 2/3 width threshold
    const leftTwoThirdsWidth = window.innerWidth * (2 / 3);

    // Function to check if element is in left 2/3
    const isInLeftTwoThirds = (element: Element): boolean => {
      const rect = element.getBoundingClientRect();
      // Consider it in left 2/3 if it starts before the 2/3 mark
      return rect.left < leftTwoThirdsWidth;
    };

    // Function to check if URL matches legacy patterns
    const isLegacyUrl = (url: string): boolean => {
      return legacyPatterns.some((pattern) =>
        url.toLowerCase().includes(pattern)
      );
    };

    // Scan for elements with background-image
    const allElements = document.querySelectorAll('*');
    let neutralizedCount = 0;

    allElements.forEach((element) => {
      if (!isInLeftTwoThirds(element)) return;

      const htmlElement = element as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlElement);
      const backgroundImage = computedStyle.backgroundImage;

      // Check if element has a background image
      if (backgroundImage && backgroundImage !== 'none') {
        if (isLegacyUrl(backgroundImage)) {
          htmlElement.style.backgroundImage = 'none';
          htmlElement.style.background = 'transparent';
          neutralizedCount++;
          console.log(
            '[useNeutralizeLegacyBackground] Neutralized background on:',
            element
          );
        }
      }
    });

    // Scan for <img> elements
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!isInLeftTwoThirds(img)) return;

      const src = img.src || '';
      const alt = img.alt || '';

      if (isLegacyUrl(src) || isLegacyUrl(alt)) {
        img.style.display = 'none';
        img.style.opacity = '0';
        neutralizedCount++;
        console.log('[useNeutralizeLegacyBackground] Neutralized image:', img);
      }
    });

    if (neutralizedCount > 0) {
      console.log(
        `[useNeutralizeLegacyBackground] Neutralized ${neutralizedCount} legacy background elements`
      );
    } else {
      console.log(
        '[useNeutralizeLegacyBackground] No legacy backgrounds found'
      );
    }

    // Only run once on mount
  }, []);
}
