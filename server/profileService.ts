import { promises as fs } from 'fs';
import { join } from 'path';

export interface UserProfile {
  id: string;
  name: string;
  interests: string[];
  preferences: {
    [key: string]: string;
  };
}

const PROFILES_FILE = join(process.cwd(), 'memory', 'profiles.json');

let profiles: UserProfile[] = [];

async function loadProfiles(): Promise<void> {
  try {
    const data = await fs.readFile(PROFILES_FILE, 'utf-8');
    profiles = JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, start with empty array
    profiles = [];
    await saveProfiles();
  }
}

async function saveProfiles(): Promise<void> {
  try {
    await fs.writeFile(
      PROFILES_FILE,
      JSON.stringify(profiles, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error('Error saving profiles:', error);
    throw error;
  }
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  await loadProfiles();
  return profiles.find((p) => p.id === userId) || null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  await loadProfiles();
  const profileIndex = profiles.findIndex((p) => p.id === userId);
  if (profileIndex === -1) {
    const newProfile: UserProfile = {
      id: userId,
      name: '',
      interests: [],
      preferences: {},
      ...updates,
    };
    profiles.push(newProfile);
    await saveProfiles();
    return newProfile;
  } else {
    profiles[profileIndex] = { ...profiles[profileIndex], ...updates };
    await saveProfiles();
    return profiles[profileIndex];
  }
}

(async () => {
  await loadProfiles();
})();
