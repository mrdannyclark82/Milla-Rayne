/**
 * Personality Prompt Helper
 * 
 * This module helps integrate A/B testing personality variants into LLM prompts.
 * It takes the prompt modifications from A/B testing and applies them to the
 * system prompts used by various AI services.
 */

import { getPromptModificationsForUser, type PersonalityVariant } from './abTestingService';

/**
 * Apply personality variant modifications to a system prompt
 * 
 * @param basePrompt - The original system prompt
 * @param userId - User identifier to get their assigned variant
 * @returns Modified prompt with A/B test variations applied
 */
export function applyPersonalityVariant(basePrompt: string, userId: string): string {
  const modifications = getPromptModificationsForUser(userId);
  
  if (!modifications || Object.keys(modifications).length === 0) {
    // No modifications, return original prompt
    return basePrompt;
  }
  
  let modifiedPrompt = basePrompt;
  
  // Apply system prompt override if specified
  if (modifications.systemPrompt) {
    modifiedPrompt = modifications.systemPrompt;
  }
  
  // Append tone adjustments
  if (modifications.toneAdjustments) {
    modifiedPrompt += `\n\n## Tone Adjustments:\n${modifications.toneAdjustments}`;
  }
  
  // Append communication style
  if (modifications.communicationStyle) {
    modifiedPrompt += `\n\n## Communication Style:\n${modifications.communicationStyle}`;
  }
  
  // Append additional instructions
  if (modifications.additionalInstructions) {
    modifiedPrompt += `\n\n## Additional Instructions:\n${modifications.additionalInstructions}`;
  }
  
  return modifiedPrompt;
}

/**
 * Get variant information for logging/debugging
 * 
 * @param userId - User identifier
 * @returns Variant info or null
 */
export function getVariantInfo(userId: string): {
  hasVariant: boolean;
  variantName?: string;
  modifications?: PersonalityVariant['promptModifications'];
} {
  const modifications = getPromptModificationsForUser(userId);
  
  if (!modifications) {
    return { hasVariant: false };
  }
  
  return {
    hasVariant: true,
    modifications,
  };
}

/**
 * Create a wrapped prompt that includes variant tracking
 * 
 * @param basePrompt - Original prompt
 * @param userId - User identifier
 * @param trackingEnabled - Whether to include tracking markers
 * @returns Modified prompt with optional tracking
 */
export function createVariantPrompt(
  basePrompt: string,
  userId: string,
  trackingEnabled: boolean = false
): {
  prompt: string;
  variantId?: string;
  hasModifications: boolean;
} {
  const modifications = getPromptModificationsForUser(userId);
  const hasModifications = modifications !== null && Object.keys(modifications).length > 0;
  
  let prompt = applyPersonalityVariant(basePrompt, userId);
  
  // Add tracking comment if enabled (will be ignored by most LLMs)
  if (trackingEnabled && hasModifications) {
    prompt = `<!-- A/B Test Variant Active -->\n${prompt}`;
  }
  
  return {
    prompt,
    hasModifications,
  };
}
