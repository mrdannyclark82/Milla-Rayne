import dotenv from 'dotenv';
dotenv.config();

console.log('Loading config.ts');

/**
 * Memoization helper for config values with key-based caching
 * Caches computed values to avoid repeated processing
 */
const memoize = <T>(fn: (...args: any[]) => T): ((...args: any[]) => T) => {
  const cache = new Map<string, T>();
  
  return (...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Helper to get boolean config values with memoization
const getBoolConfig = memoize((key: string, defaultValue: boolean = false): boolean => {
  return process.env[key] === 'true' || 
         (defaultValue && process.env[key] !== 'false');
});

// Helper to get integer config values with memoization
const getIntConfig = memoize((key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
});

export const config = {
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: process.env.HUGGINGFACE_MODEL,
  },
  memory: {
    key: process.env.MEMORY_KEY,
    enableSummarization: process.env.MEMORY_ENABLE_SUMMARIZATION === 'true',
    summarizationCron: process.env.MEMORY_SUMMARIZATION_CRON || '0 0 * * *',
  },
  admin: {
    token: process.env.ADMIN_TOKEN,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  xai: {
    apiKey: process.env.XAI_API_KEY,
    model: process.env.XAI_MODEL,
  },
  venice: {
    apiKey: process.env.VENICE_API_KEY,
    model: process.env.VENICE_MODEL || 'venice/venice-uncensored',
  },
  minimax: {
    apiKey: process.env.MINIMAX_API_KEY,
    model: process.env.MINIMAX_MODEL || 'abab6.5-chat',
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
    minimaxApiKey: process.env.OPENROUTER_MINIMAX_API_KEY,
    grok1ApiKey: process.env.OPENROUTER_GROK1_API_KEY,
    grok4ApiKey: process.env.OPENROUTER_GROK4_API_KEY,
    katCoderApiKey: process.env.OPENROUTER_KAT_CODER_API_KEY,
    geminiFlashApiKey: process.env.OPENROUTER_GEMINI_FLASH_API_KEY,
    minimaxModel: process.env.OPENROUTER_MINIMAX_MODEL || 'openai/gpt-3.5-turbo',
    grok1Model: process.env.OPENROUTER_GROK1_MODEL || 'x-ai/grok-code-fast-1',
    grok4Model: process.env.OPENROUTER_GROK4_MODEL || 'x-ai/grok-4.1-fast:free',
    katCoderModel: process.env.OPENROUTER_KAT_CODER_MODEL || 'kwaipilot/kat-coder-pro:free',
    geminiFlashModel: process.env.OPENROUTER_GEMINI_FLASH_MODEL || 'google/gemini-2.0-flash-001',
    geminiApiKey: process.env.OPENROUTER_GEMINI_API_KEY,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY,
  },
  google: {
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Accept either GOOGLE_REDIRECT_URI (preferred) or the older GOOGLE_OAUTH_REDIRECT_URI
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_OAUTH_REDIRECT_URI,
  },
  smartHome: {
    enableIntegration: process.env.ENABLE_SMART_HOME === 'true',
  },
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
  },
  banana: {
    apiKey: process.env.BANANA_API_KEY,
    apiUrl: process.env.BANANA_API_URL,
    apiEndpoint: process.env.BANANA_API_ENDPOINT,
    modelKey: process.env.BANANA_MODEL_KEY,
    model: process.env.BANANA_MODEL,
  },
  email: {
    sendEmails: process.env.SEND_EMAILS === 'true',
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromAddress: process.env.EMAIL_FROM || 'noreply@example.com',
    deliveryIntervalMs: parseInt(
      process.env.EMAIL_DELIVERY_INTERVAL_MS || '60000',
      10
    ),
    maxAttempts: parseInt(process.env.EMAIL_MAX_ATTEMPTS || '3', 10),
    // SMTP specific settings (used when provider === 'smtp')
    smtp: {
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT
        ? parseInt(process.env.EMAIL_SMTP_PORT, 10)
        : undefined,
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      requireTLS: process.env.EMAIL_SMTP_REQUIRE_TLS === 'true',
    },
    // Backoff settings for retries (ms)
    baseBackoffMs: parseInt(process.env.EMAIL_BASE_BACKOFF_MS || '60000', 10),
    maxBackoffMs: parseInt(
      process.env.EMAIL_MAX_BACKOFF_MS || String(24 * 60 * 60 * 1000),
      10
    ),
  },
  // Feature flags and global settings
  enableDevTalk: process.env.ENABLE_DEV_TALK === 'true',
  enablePredictiveUpdates: process.env.ENABLE_PREDICTIVE_UPDATES === 'true',
  enableProactiveRepositoryManagement:
    process.env.ENABLE_PROACTIVE_REPOSITORY_MANAGEMENT !== 'false', // default true
  enableProactiveMessages: process.env.ENABLE_PROACTIVE_MESSAGES !== 'false', // default true
  enableAutonomousCodeImprovement: process.env.ENABLE_AUTONOMOUS_CODE_IMPROVEMENT !== 'false', // default true
  maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '1024', 10),
  proactiveRepoManager: {
    checkInterval: parseInt(
      process.env.PROACTIVE_CHECK_INTERVAL || '10800000',
      10
    ), // 3 hours
    suggestionsSlice: parseInt(
      process.env.PROACTIVE_SUGGESTIONS_SLICE || '3',
      10
    ),
    featureDiscoveryInterval: parseInt(
      process.env.PROACTIVE_FEATURE_DISCOVERY_INTERVAL || '86400000',
      10
    ), // 24 hours
    topFeatureRecommendations: parseInt(
      process.env.PROACTIVE_TOP_FEATURE_RECOMMENDATIONS || '3',
      10
    ),
    featureRelevanceThreshold: parseInt(
      process.env.PROACTIVE_FEATURE_RELEVANCE_THRESHOLD || '7',
      10
    ),
    initialCheckTimeout: parseInt(
      process.env.PROACTIVE_INITIAL_CHECK_TIMEOUT || '60000',
      10
    ), // 1 minute
    optimizationTokenAward: parseInt(
      process.env.PROACTIVE_OPTIMIZATION_TOKEN_AWARD || '30',
      10
    ),
  },
  // Local model configuration
  localModel: {
    enabled: process.env.ENABLE_LOCAL_MODEL === 'true',
    modelPath: process.env.LOCAL_MODEL_PATH || 'locallm/gemma.tflite',
    preferLocal: process.env.PREFER_LOCAL_MODEL === 'true', // If true, use local by default
  },
};
