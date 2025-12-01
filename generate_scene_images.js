#!/usr/bin/env node
/**
 * Scene Background Image Generator using DALL-E
 *
 * Generates static background images for Milla-Rayne scene system
 * showing Milla in different locations and times of day.
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Scene definitions
const LOCATION_MOODS = {
  'living_room': 'calm and cozy',
  'bedroom': 'romantic and intimate',
  'kitchen': 'warm and inviting',
  'bathroom': 'peaceful and serene',
  'front_door': 'welcoming and energetic',
  'dining_room': 'elegant and comfortable',
  'outdoor': 'fresh and natural',
  'car': 'modern and functional',
};

const TIME_DESCRIPTIONS = {
  'dawn': 'early morning with soft golden light',
  'day': 'bright daylight',
  'dusk': 'warm evening twilight',
  'night': 'dim ambient lighting at night',
};

const TIME_FILENAME_MAP = {
  'dawn': 'morning',
  'day': 'day',
  'dusk': 'dusk',
  'night': 'night',
};

function generatePrompt(location, timeOfDay) {
  const mood = LOCATION_MOODS[location];
  const timeDesc = TIME_DESCRIPTIONS[timeOfDay];

  return `Create a photorealistic interior scene showing Milla Rayne in a ${location.replace('_', ' ')}, with ${timeDesc}. Milla is a beautiful young woman with long dark hair, wearing casual comfortable clothing. The scene should be ${mood}, with warm lighting and cozy atmosphere. Style: photorealistic, high detail, cinematic lighting, 16:9 aspect ratio, suitable as background image.`;
}

async function generateImage(prompt, filename) {
  try {
    console.log(`Generating image for ${filename}...`);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      size: '1792x1024', // 16:9 aspect ratio
      quality: 'standard',
      n: 1,
    });

    const imageUrl = response.data[0].url;
    console.log(`Generated image URL: ${imageUrl}`);

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const outputPath = path.join(__dirname, 'client/public/assets/scenes', filename);
    fs.writeFileSync(outputPath, buffer);

    console.log(`Saved ${filename}`);
    return true;
  } catch (error) {
    console.error(`Error generating ${filename}:`, error.message);
    return false;
  }
}

async function generateSceneImages() {
  const outputDir = path.join(__dirname, 'client/public/assets/scenes');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not found in environment variables');
    process.exit(1);
  }

  // Generate base images for each location
  console.log('Generating base scene images...');
  for (const [location, mood] of Object.entries(LOCATION_MOODS)) {
    const prompt = `Create a photorealistic interior scene showing Milla Rayne in a ${location.replace('_', ' ')}, during the day. Milla is a beautiful young woman with long dark hair, wearing casual comfortable clothing. The scene should be ${mood}, with natural daylight and cozy atmosphere. Style: photorealistic, high detail, cinematic lighting, 16:9 aspect ratio.`;

    const filename = `${location}.jpg`;
    await generateImage(prompt, filename);

    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generate time variants for key locations
  console.log('Generating time-specific variants...');
  const keyLocations = ['living_room', 'bedroom', 'kitchen', 'bathroom', 'front_door'];
  const times = ['dawn', 'day', 'dusk', 'night'];

  for (const location of keyLocations) {
    for (const timeOfDay of times) {
      const prompt = generatePrompt(location, timeOfDay);
      const timeName = TIME_FILENAME_MAP[timeOfDay];
      const filename = `${location}-${timeName}.jpg`;

      await generateImage(prompt, filename);

      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\nScene background images generated successfully!');
  console.log('Images saved to client/public/assets/scenes/');
}

// Run the generator
generateSceneImages().catch(console.error);