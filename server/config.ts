import dotenv from 'dotenv';
dotenv.config();

console.log('Loading config.ts');

export const config = {
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
  },
  memory: {
    key: process.env.MEMORY_KEY,
  },
  admin: {
    token: process.env.ADMIN_TOKEN,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  xai: {
    apiKey: process.env.XAI_API_KEY,
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    minimaxApiKey: process.env.OPENROUTER_MINIMAX_API_KEY,
    grok1ApiKey: process.env.OPENROUTER_GROK1_API_KEY,
    minimaxModel: 'openai/gpt-3.5-turbo',
    grok1Model: 'openai/gpt-3.5-turbo',
  },
  smartHome: {
    enableIntegration: process.env.ENABLE_SMART_HOME === 'true',
  },
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
  },
};