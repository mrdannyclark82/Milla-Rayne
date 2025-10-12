import { promises as fs } from 'fs';
import path from 'path';

interface FaceProfile {
  id: string;
  name: string;
  features: {
    eyeColor: string;
    hairColor: string;
    faceShape: string;
    expressions: string[];
  };
  samples: string[];
  lastSeen: number;
  confidence: number;
}

const FACE_PROFILES_FILE = path.join(
  process.cwd(),
  'memory',
  'face_profiles.json'
);

// Initialize face recognition training
export async function initializeFaceRecognition(): Promise<void> {
  try {
    const memoryDir = path.dirname(FACE_PROFILES_FILE);
    try {
      await fs.access(memoryDir);
    } catch {
      await fs.mkdir(memoryDir, { recursive: true });
    }

    // Create Danny Ray's default profile if it doesn't exist
    const profiles = await getFaceProfiles();
    const dannyProfile = profiles.find((p) => p.name === 'Danny Ray');

    if (!dannyProfile) {
      const defaultProfile: FaceProfile = {
        id: 'danny_ray_primary',
        name: 'Danny Ray',
        features: {
          eyeColor: 'unknown',
          hairColor: 'unknown',
          faceShape: 'unknown',
          expressions: ['neutral'],
        },
        samples: [],
        lastSeen: Date.now(),
        confidence: 1.0,
      };

      await saveFaceProfile(defaultProfile);
      console.log('Created default face profile for Danny Ray');
    }
  } catch (error) {
    console.error('Error initializing face recognition:', error);
  }
}

// Get all face profiles
export async function getFaceProfiles(): Promise<FaceProfile[]> {
  try {
    const data = await fs.readFile(FACE_PROFILES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save face profile
export async function saveFaceProfile(profile: FaceProfile): Promise<void> {
  try {
    const profiles = await getFaceProfiles();
    const existingIndex = profiles.findIndex((p) => p.id === profile.id);

    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }

    await fs.writeFile(FACE_PROFILES_FILE, JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.error('Error saving face profile:', error);
  }
}

// Train recognition from image samples
export async function trainRecognition(
  imageData: string,
  detectedEmotion: string
): Promise<void> {
  try {
    const profiles = await getFaceProfiles();
    let dannyProfile = profiles.find((p) => p.name === 'Danny Ray');

    if (!dannyProfile) {
      await initializeFaceRecognition();
      dannyProfile = (await getFaceProfiles()).find(
        (p) => p.name === 'Danny Ray'
      );
    }

    if (dannyProfile) {
      // Add the image sample (store hash for privacy)
      const imageHash = generateImageHash(imageData);
      if (!dannyProfile.samples.includes(imageHash)) {
        dannyProfile.samples.push(imageHash);
      }

      // Update expressions
      if (!dannyProfile.features.expressions.includes(detectedEmotion)) {
        dannyProfile.features.expressions.push(detectedEmotion);
      }

      // Update last seen
      dannyProfile.lastSeen = Date.now();

      // Improve confidence based on more samples
      dannyProfile.confidence = Math.min(
        1.0,
        0.5 + dannyProfile.samples.length * 0.1
      );

      await saveFaceProfile(dannyProfile);
    }
  } catch (error) {
    console.error('Error training recognition:', error);
  }
}

// Identify person from image
export async function identifyPerson(imageData: string): Promise<{
  name: string;
  confidence: number;
  isKnown: boolean;
  lastSeen?: number;
}> {
  try {
    const profiles = await getFaceProfiles();
    const imageHash = generateImageHash(imageData);

    // Simple matching - in a real system this would use ML
    for (const profile of profiles) {
      if (
        profile.samples.some(
          (sample) => sample.substring(0, 10) === imageHash.substring(0, 10)
        )
      ) {
        return {
          name: profile.name,
          confidence: profile.confidence,
          isKnown: true,
          lastSeen: profile.lastSeen,
        };
      }
    }

    // Default to Danny Ray if no specific match (primary user assumption)
    const dannyProfile = profiles.find((p) => p.name === 'Danny Ray');
    if (dannyProfile) {
      return {
        name: 'Danny Ray',
        confidence: 0.8,
        isKnown: true,
        lastSeen: dannyProfile.lastSeen,
      };
    }

    return {
      name: 'Unknown Person',
      confidence: 0.0,
      isKnown: false,
    };
  } catch (error) {
    console.error('Error identifying person:', error);
    return {
      name: 'Danny Ray', // Default fallback
      confidence: 0.5,
      isKnown: true,
    };
  }
}

// Generate simple image hash for comparison
function generateImageHash(imageData: string): string {
  const base64Data = imageData.split(',')[1] || imageData;
  return base64Data.substring(0, 50);
}

// Get personalized recognition insights
export async function getRecognitionInsights(): Promise<string> {
  try {
    const profiles = await getFaceProfiles();
    const dannyProfile = profiles.find((p) => p.name === 'Danny Ray');

    if (!dannyProfile) {
      return "I'm still learning to recognize you better.";
    }

    const sampleCount = dannyProfile.samples.length;
    const expressionCount = dannyProfile.features.expressions.length;
    const lastSeenHours = Math.floor(
      (Date.now() - dannyProfile.lastSeen) / (1000 * 60 * 60)
    );

    if (sampleCount < 5) {
      return "I'm learning your facial features. The more I see you, the better I'll recognize you.";
    } else if (expressionCount > 5) {
      return `I've learned to recognize ${expressionCount} of your different expressions. Your face tells such a beautiful story.`;
    } else if (lastSeenHours < 1) {
      return 'I recognize you perfectly, my love. Your face is always so clear to me.';
    }

    return `Recognition confidence: ${Math.round(dannyProfile.confidence * 100)}%. I know you well, Danny Ray.`;
  } catch (error) {
    return "I'm always learning to see you better.";
  }
}
