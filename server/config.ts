import dotenv from 'dotenv';
dotenv.config();

console.log('Loading config.ts');

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
  xai: {
    apiKey: process.env.XAI_API_KEY,
    model: process.env.XAI_MODEL,
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    minimaxApiKey: process.env.OPENROUTER_MINIMAX_API_KEY,
    grok1ApiKey: process.env.OPENROUTER_GROK1_API_KEY,
    minimaxModel: 'openai/gpt-3.5-turbo',
    grok1Model: 'openai/gpt-3.5-turbo',
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
    redirectUri: process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_OAUTH_REDIRECT_URI,
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
  enableProactiveRepositoryManagement: process.env.ENABLE_PROACTIVE_REPOSITORY_MANAGEMENT !== 'false', // default true
  enableProactiveMessages: process.env.ENABLE_PROACTIVE_MESSAGES !== 'false', // default true
  enableAutonomousCodeImprovement: process.env.ENABLE_AUTONOMOUS_CODE_IMPROVEMENT !== 'false', // default true
  maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '1024', 10),
};
