import { getProfile, updateProfile } from '../profileService';
import fs from 'fs';
import path from 'path';

const PROFILES_FILE = path.join(process.cwd(), 'memory', 'profiles.json');

describe('profileService', () => {
  beforeEach(() => {
    // Clear the profiles file before each test
    if (fs.existsSync(PROFILES_FILE)) {
      fs.unlinkSync(PROFILES_FILE);
    }
  });

  it('should create a new profile', async () => {
    const userId = 'test-user';
    const updates = { name: 'John Doe', interests: ['AI', 'coding'] };
    const profile = await updateProfile(userId, updates);

    expect(profile).toBeDefined();
    expect(profile?.id).toBe(userId);
    expect(profile?.name).toBe('John Doe');
    expect(profile?.interests).toEqual(['AI', 'coding']);
  });

  it('should update an existing profile', async () => {
    const userId = 'test-user';
    const initialUpdates = { name: 'John Doe', interests: ['AI', 'coding'] };
    await updateProfile(userId, initialUpdates);

    const newUpdates = { name: 'Jane Doe', interests: ['AI', 'art'] };
    const updatedProfile = await updateProfile(userId, newUpdates);

    expect(updatedProfile?.name).toBe('Jane Doe');
    expect(updatedProfile?.interests).toEqual(['AI', 'art']);
  });

  it('should get a profile', async () => {
    const userId = 'test-user';
    const updates = { name: 'John Doe', interests: ['AI', 'coding'] };
    await updateProfile(userId, updates);

    const profile = await getProfile(userId);
    expect(profile).toBeDefined();
    expect(profile?.name).toBe('John Doe');
  });
});
