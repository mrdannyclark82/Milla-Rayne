/**
 * Mood Background Image Generation Service
 * 
 * Generates AI images for different scene moods using Hugging Face
 * Caches generated images to avoid regenerating the same mood
 */

import { promises as fs } from 'fs';
import path from 'path';
import { generateImage } from './imageService';

export type SceneMood = 'calm' | 'energetic' | 'romantic' | 'mysterious' | 'playful';

interface MoodImageCache {
  [mood: string]: {
    imageUrl: string;
    generatedAt: number;
    prompt: string;
  };
}

const MOOD_PROMPTS: Record<SceneMood, string> = {
  calm: 'serene peaceful landscape, soft pastel colors, gentle flowing water, minimalist zen garden, tranquil atmosphere, soft morning light, misty mountains in distance, calm blue sky, peaceful nature scene, 4k high quality',
  energetic: 'vibrant dynamic cityscape, neon lights, fast motion blur, electric energy, bright bold colors, lightning strikes, explosive colors, racing streaks of light, high energy atmosphere, cyberpunk style, 4k high quality',
  romantic: 'romantic sunset scene, warm golden hour lighting, soft pink and purple sky, couple silhouettes, heart-shaped elements, rose petals floating, candlelit ambiance, dreamy bokeh lights, tender atmosphere, 4k high quality',
  mysterious: 'dark mysterious forest, fog rolling through trees, moonlight filtering through mist, deep shadows, ethereal glow, ancient ruins, mystical atmosphere, purple and blue tones, enigmatic scene, 4k high quality',
  playful: 'whimsical colorful scene, rainbow colors, bubbles floating, confetti, joyful bright patterns, cartoon-style clouds, bouncing elements, fun textures, cheerful atmosphere, vibrant playful energy, 4k high quality'
};

class MoodBackgroundService {
  private cacheFile: string;
  private cache: MoodImageCache = {};
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'memory', 'mood_backgrounds');
    this.cacheFile = path.join(this.cacheDir, 'cache.json');
  }

  async initialize(): Promise<void> {
    // Ensure cache directory exists
    await fs.mkdir(this.cacheDir, { recursive: true });
    
    // Load existing cache
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      this.cache = JSON.parse(data);
      console.log('Mood background cache loaded');
    } catch (error) {
      console.log('No existing mood background cache, starting fresh');
    }
  }

  /**
   * Generate or retrieve cached background for a mood
   */
  async getBackgroundForMood(mood: SceneMood, forceRegenerate: boolean = false): Promise<{
    success: boolean;
    imageUrl?: string;
    error?: string;
    cached?: boolean;
  }> {
    // Check cache first (unless force regenerate)
    if (!forceRegenerate && this.cache[mood]) {
      const cached = this.cache[mood];
      // Cache valid for 7 days
      const isValid = Date.now() - cached.generatedAt < 7 * 24 * 60 * 60 * 1000;
      
      if (isValid) {
        console.log(`Using cached background for mood: ${mood}`);
        return {
          success: true,
          imageUrl: cached.imageUrl,
          cached: true
        };
      }
    }

    // Generate new image
    console.log(`Generating new background for mood: ${mood}`);
    const prompt = MOOD_PROMPTS[mood];
    
    try {
      const result = await generateImage(prompt);
      
      if (result.success && result.imageUrl) {
        // Save to cache
        this.cache[mood] = {
          imageUrl: result.imageUrl,
          generatedAt: Date.now(),
          prompt
        };
        
        await this.saveCache();
        
        return {
          success: true,
          imageUrl: result.imageUrl,
          cached: false
        };
      }
      
      return {
        success: false,
        error: result.error || 'Image generation failed'
      };
    } catch (error: any) {
      console.error('Error generating mood background:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Pregenerate all mood backgrounds
   */
  async pregenerateAllBackgrounds(): Promise<void> {
    console.log('Pregenerating all mood backgrounds...');
    const moods: SceneMood[] = ['calm', 'energetic', 'romantic', 'mysterious', 'playful'];
    
    for (const mood of moods) {
      // Skip if already cached
      if (this.cache[mood]) {
        console.log(`Background for ${mood} already cached, skipping`);
        continue;
      }
      
      await this.getBackgroundForMood(mood);
      // Small delay between generations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('All mood backgrounds pregenerated');
  }

  /**
   * Clear cache for a specific mood or all moods
   */
  async clearCache(mood?: SceneMood): Promise<void> {
    if (mood) {
      delete this.cache[mood];
      console.log(`Cleared cache for mood: ${mood}`);
    } else {
      this.cache = {};
      console.log('Cleared all mood background cache');
    }
    
    await this.saveCache();
  }

  /**
   * Get all cached backgrounds
   */
  getCachedBackgrounds(): MoodImageCache {
    return { ...this.cache };
  }

  /**
   * Save cache to disk
   */
  private async saveCache(): Promise<void> {
    try {
      await fs.writeFile(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error('Error saving mood background cache:', error);
    }
  }
}

// Singleton instance
const moodBackgroundService = new MoodBackgroundService();

export async function initializeMoodBackgroundService(): Promise<void> {
  await moodBackgroundService.initialize();
}

export async function getMoodBackground(mood: SceneMood, forceRegenerate?: boolean) {
  return await moodBackgroundService.getBackgroundForMood(mood, forceRegenerate);
}

export async function pregenerateAllMoodBackgrounds() {
  return await moodBackgroundService.pregenerateAllBackgrounds();
}

export async function clearMoodBackgroundCache(mood?: SceneMood) {
  return await moodBackgroundService.clearCache(mood);
}

export function getCachedMoodBackgrounds() {
  return moodBackgroundService.getCachedBackgrounds();
}

export default moodBackgroundService;
