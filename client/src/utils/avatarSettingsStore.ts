/**
 * Avatar Settings Store
 * Manages persistence and access to avatar settings via localStorage
 */

export interface AvatarSettings {
  style: 'realistic' | 'anime' | 'artistic' | 'minimal';
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  outfit: 'casual' | 'elegant' | 'professional' | 'intimate';
  expression: 'loving' | 'playful' | 'mysterious' | 'gentle';
  background: 'gradient' | 'solid' | 'nature' | 'abstract';
  lighting: number; // 0-100
  glow: number; // 0-100
}

const STORAGE_KEY = 'milla.avatar.settings.v1';
const SETTINGS_VERSION = 1;

interface StoredSettings {
  version: number;
  settings: AvatarSettings;
}

export function getDefaultAvatarSettings(): AvatarSettings {
  return {
    style: 'realistic',
    hairColor: 'auburn',
    eyeColor: 'green',
    skinTone: 'warm',
    outfit: 'casual',
    expression: 'loving',
    background: 'gradient',
    lighting: 75,
    glow: 60,
  };
}

export function loadAvatarSettings(): AvatarSettings {
  if (typeof window === 'undefined') {
    return getDefaultAvatarSettings();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultAvatarSettings();
    }

    const parsed: StoredSettings = JSON.parse(stored);

    if (parsed.version !== SETTINGS_VERSION) {
      console.warn('Avatar settings version mismatch, using defaults');
      return getDefaultAvatarSettings();
    }

    const s = parsed.settings;
    return {
      style: ['realistic', 'anime', 'artistic', 'minimal'].includes(s.style) ? s.style : 'realistic',
      hairColor: s.hairColor || 'auburn',
      eyeColor: s.eyeColor || 'green',
      skinTone: s.skinTone || 'warm',
      outfit: ['casual', 'elegant', 'professional', 'intimate'].includes(s.outfit) ? s.outfit : 'casual',
      expression: ['loving', 'playful', 'mysterious', 'gentle'].includes(s.expression) ? s.expression : 'loving',
      background: ['gradient', 'solid', 'nature', 'abstract'].includes(s.background) ? s.background : 'gradient',
      lighting: typeof s.lighting === 'number' ? Math.min(Math.max(s.lighting, 0), 100) : 75,
      glow: typeof s.glow === 'number' ? Math.min(Math.max(s.glow, 0), 100) : 60,
    };
  } catch (error) {
    console.error('Error loading avatar settings:', error);
    return getDefaultAvatarSettings();
  }
}

export function saveAvatarSettings(settings: AvatarSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stored: StoredSettings = {
      version: SETTINGS_VERSION,
      settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    // Trigger storage event for cross-tab sync
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error saving avatar settings:', error);
  }
}

export function updateAvatarSettings(
  partial: Partial<AvatarSettings>
): AvatarSettings {
  const current = loadAvatarSettings();
  const updated = { ...current, ...partial };
  saveAvatarSettings(updated);
  return updated;
}

export function onAvatarSettingsChange(
  callback: (settings: AvatarSettings) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => {
    callback(loadAvatarSettings());
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
