/**
 * Example integration of the December 8-17 Empire Updates
 * This file demonstrates how to use the new components in your application
 */

import { dispatchQuery } from '../../server/dispatcher/fallback-dispatcher';
import { gemini3R } from '../../server/dispatcher/gemini3-reason';
import { gemmaMP } from '../../android/gemma-wrapper-mp';

/**
 * Example 1: Simple query using the dispatcher with automatic fallback
 */
export async function simpleQueryExample() {
  try {
    const userQuery = 'What is the weather like today?';
    const response = await dispatchQuery(userQuery);
    console.log('Response:', response);
    return response;
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

/**
 * Example 2: Using a specific provider
 */
export async function specificProviderExample() {
  try {
    // Use Gemini 3 directly
    const response1 = await dispatchQuery('Tell me a joke', 'gemini3');
    
    // Use local Gemma model
    const response2 = await dispatchQuery('What is TypeScript?', 'gemma-local');
    
    return { gemini3: response1, gemma: response2 };
  } catch (error) {
    console.error('Provider query failed:', error);
    throw error;
  }
}

/**
 * Example 3: Direct use of Gemini 3 Reasoner for complex reasoning tasks
 */
export async function reasoningExample() {
  try {
    const complexQuery = `
      Given the following scenario:
      - A user wants to optimize their daily routine
      - They have 2 hours of free time
      - They want to improve their health and learn a new skill
      
      What would you recommend?
    `;
    
    const recommendation = await gemini3R.reason(complexQuery);
    console.log('Recommendation:', recommendation);
    return recommendation;
  } catch (error) {
    console.error('Reasoning failed:', error);
    throw error;
  }
}

/**
 * Example 4: Direct use of Gemma MP wrapper for local, privacy-focused inference
 */
export async function localInferenceExample() {
  try {
    // Initialize with a specific model
    await gemmaMP.setup('gemma-2b');
    
    // Generate responses locally
    const response1 = await gemmaMP.generate('Hello, how are you?');
    console.log('Local response 1:', response1);
    
    // With custom token limit
    const response2 = await gemmaMP.generate('Tell me about AI', 256);
    console.log('Local response 2:', response2);
    
    return { response1, response2 };
  } catch (error) {
    console.error('Local inference failed:', error);
    throw error;
  }
}

/**
 * Example 5: Integration in a chat/agent system
 */
export async function chatAgentIntegration(userMessage: string, preferLocal: boolean = true) {
  try {
    const provider = preferLocal ? 'gemma-local' : 'gemini3';
    
    // Add context or system instructions if needed
    const contextualQuery = `User message: ${userMessage}`;
    
    const response = await dispatchQuery(contextualQuery, provider);
    
    return {
      success: true,
      response,
      usedLocal: preferLocal,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Chat integration failed:', error);
    
    // Fallback to cloud if local fails
    if (preferLocal) {
      console.log('Retrying with cloud provider...');
      return chatAgentIntegration(userMessage, false);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Example 6: Privacy mode detection (for use with LowPowerPrivacy component)
 */
export function detectPrivacyMode(): 'offline' | 'hybrid' | 'cloud' {
  // Check if local model is available
  const hasLocalModel = process.env.ENABLE_LOCAL_MODEL === 'true';
  const preferLocal = process.env.PREFER_LOCAL_MODEL === 'true';
  const hasCloudAPI = !!process.env.GEMINI_API_KEY;
  
  if (hasLocalModel && preferLocal && !hasCloudAPI) {
    return 'offline';
  } else if (hasLocalModel && hasCloudAPI) {
    return 'hybrid';
  } else {
    return 'cloud';
  }
}

// Export all examples for easy testing
export const examples = {
  simpleQueryExample,
  specificProviderExample,
  reasoningExample,
  localInferenceExample,
  chatAgentIntegration,
  detectPrivacyMode,
};
