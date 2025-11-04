/**
 * CONFIGURATION
 *
 * This file loads and validates all environment variables.
 * The rest of the application should import the configuration from this file
 * instead of accessing process.env directly.
 */

import dotenv from 'dotenv';

dotenv.config();

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    return '';
  }
  return value;
}

export const config = {
  google: {
    clientId: getEnv('GOOGLE_CLIENT_ID'),
    clientSecret: getEnv('GOOGLE_CLIENT_SECRET'),
    redirectUri: getEnv('GOOGLE_OAUTH_REDIRECT_URI'),
    mapsApiKey: getEnv('GOOGLE_MAPS_API_KEY'),
  },
  elevenLabs: {
    apiKey: getEnv('ELEVENLABS_API_KEY'),
  },
  openrouter: {
    apiKey: getEnv('OPENROUTER_API_KEY'),
    geminiApiKey: getEnv('OPENROUTER_GEMINI_API_KEY'),
    minimaxApiKey: getEnv('OPENROUTER_MINIMAX_API_KEY'),
    minimaxModel: getEnv('MINIMAX_MODEL') || 'deepseek/deepseek-chat-v3.1:free',
    grok1ApiKey: getEnv('OPENROUTER_GROK1_API_KEY'),
    grok1Model: getEnv('OPENROUTER_GROK1_MODEL') || 'x-ai/grok-1-fast',
  },
  gemini: {
    apiKey: getEnv('GEMINI_API_KEY'),
  },
  xai: {
    apiKey: getEnv('XAI_API_KEY'),
    model: getEnv('XAI_MODEL') || 'grok-3',
  },
  banana: {
    apiKey: process.env.BANANA_API_KEY,
    apiUrl: process.env.BANANA_API_URL,
    apiEndpoint: process.env.BANANA_ENDPOINT,
    modelKey: process.env.BANANA_MODEL_KEY,
    model: process.env.BANANA_MODEL,
  },
  huggingface: {
    apiKey: getEnv('HUGGINGFACE_API_KEY'),
    model: process.env.HUGGINGFACE_MODEL,
  },
  openai: {
    apiKey: getEnv('OPENAI_API_KEY'),
  },
  admin: {
    token: process.env.ADMIN_TOKEN,
  },
  memory: {
    key: getEnv('MEMORY_KEY'),
    enableSummarization: process.env.ENABLE_MEMORY_SUMMARIZATION === 'true',
    summarizationCron: getEnv('MEMORY_SUMMARIZATION_CRON'),
  },
  enableDevTalk: process.env.ENABLE_DEV_TALK === 'true',
  enablePredictiveUpdates: process.env.ENABLE_PREDICTIVE_UPDATES === 'true',
  enableAdvancedParser: process.env.ENABLE_ADVANCED_PARSER !== 'false',
  maxOutputTokens: process.env.MAX_OUTPUT_TOKENS ? parseInt(process.env.MAX_OUTPUT_TOKENS, 10) : 1024,
  smartHome: {
    enableIntegration: process.env.ENABLE_SMART_HOME_INTEGRATION === 'true',
    apiEndpoint: getEnv('SMART_HOME_API_ENDPOINT'),
    apiKey: getEnv('SMART_HOME_API_KEY'),
  },
};