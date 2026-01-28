/**
 * Scene Settings Panel
 * User controls for adaptive background settings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SceneSettings, SceneMood, BackgroundMode } from '@/types/scene';
import {
  loadSceneSettings,
  saveSceneSettings,
  onSettingsChange as subscribeToSettingsChange,
} from '@/utils/sceneSettingsStore';
import { proactiveGet } from '@/lib/proactiveApi';

interface SceneSettingsPanelProps {
  onSettingsChange?: (settings: SceneSettings) => void;
}

export const SceneSettingsPanel: React.FC<SceneSettingsPanelProps> = ({
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<SceneSettings>(() =>
    loadSceneSettings()
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasBackgroundControl, setHasBackgroundControl] = useState(false);

  // Check if background control is unlocked
  useEffect(() => {
    const checkRewards = async () => {
      try {
        const data = await proactiveGet('/api/milla/tokens/rewards');
        if (data.success) {
          const unlocked = data.rewards.includes('UNLOCK_BACKGROUND_CONTROL');
          setHasBackgroundControl(unlocked);
          
          // If unlocked and has a mood set, fetch the background
          if (unlocked && settings.mood) {
            fetchMoodBackground(settings.mood);
          }
        }
      } catch (error) {
        console.error('Error checking rewards:', error);
        // Default to locked
        setHasBackgroundControl(false);
      }
    };
    checkRewards();
  }, []);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Listen for cross-tab settings changes
  useEffect(() => {
    const unsubscribe = subscribeToSettingsChange(
      (newSettings: SceneSettings) => {
        setSettings(newSettings);
        if (onSettingsChange) {
          onSettingsChange(newSettings);
        }
      }
    );
    return unsubscribe;
  }, [onSettingsChange]);

  const updateSetting = <K extends keyof SceneSettings>(
    key: K,
    value: SceneSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSceneSettings(updated);
    onSettingsChange?.(updated);
    
    // If mood changed and background control is unlocked, fetch mood background
    if (key === 'mood' && hasBackgroundControl) {
      fetchMoodBackground(value as string);
    }
  };

  // Fetch mood background image
  const fetchMoodBackground = async (mood: string) => {
    try {
      const response = await fetch(`/api/scene/mood-background/${mood}`);
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        console.log(`Mood background loaded for ${mood}:`, data.cached ? 'cached' : 'generated');
        // The background will be applied by the scene manager
        // Trigger a scene update event if needed
        window.dispatchEvent(new CustomEvent('moodBackgroundUpdated', {
          detail: { mood, imageUrl: data.imageUrl }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch mood background:', error);
    }
  };

  // Map particle density to display values
  const particleDensityValues = ['off', 'low', 'medium', 'high'] as const;
  const particleDensityIndex = particleDensityValues.indexOf(
    settings.particleDensity
  );

  return (
    <Card className="bg-blue-500 border-gray-600">
      <CardHeader>
        <CardTitle className="text-base font-bold text-white">
          Adaptive Background
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Adaptive Background</label>
          <Button
            variant={settings.enabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateSetting('enabled', !settings.enabled)}
            aria-pressed={settings.enabled}
          >
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {/* Mood Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Mood {!hasBackgroundControl && '🔒'}
          </label>
          {!hasBackgroundControl && (
            <p className="text-xs text-yellow-400 mb-2">
              Unlock background control by completing the "Scene Designer" goal!
            </p>
          )}
          <Select
            value={settings.mood}
            onValueChange={(value) => updateSetting('mood', value as SceneMood)}
            disabled={!settings.enabled || settings.sceneBackgroundFromRP || !hasBackgroundControl}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calm">Calm</SelectItem>
              <SelectItem value="energetic">Energetic</SelectItem>
              <SelectItem value="romantic">Romantic</SelectItem>
              <SelectItem value="mysterious">Mysterious</SelectItem>
              <SelectItem value="playful">Playful</SelectItem>
            </SelectContent>
          </Select>
          {settings.sceneBackgroundFromRP && (
            <p className="text-xs text-muted-foreground">
              Mood is controlled by RP scene
            </p>
          )}
        </div>

        {/* Winter Theme Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Winter Theme</label>
          <Button
            variant={settings.winterTheme ? "default" : "outline"}
            size="sm"
            onClick={() => updateSetting("winterTheme", !settings.winterTheme)}
            aria-pressed={settings.winterTheme}
            disabled={!settings.enabled}
          >
            {settings.winterTheme ? "ON" : "OFF"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Force snowy night scene (overrides seasonal detection)
          </p>
        </div>
        {/* Background Mode Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Background Mode</label>
          <Select
            value={settings.backgroundMode || 'auto'}
            onValueChange={(value) =>
              updateSetting('backgroundMode', value as BackgroundMode)
            }
            disabled={!settings.enabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (Smart)</SelectItem>
              <SelectItem value="css-animated">CSS Animated</SelectItem>
              <SelectItem value="static-image">Static Image</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {settings.backgroundMode === 'static-image' &&
              'Uses static images from /assets/scenes/'}
            {settings.backgroundMode === 'css-animated' &&
              'Uses animated gradient backgrounds'}
            {(!settings.backgroundMode || settings.backgroundMode === 'auto') &&
              'Auto-selects based on location'}
          </p>
        </div>

        {/* Background mirrors RP scene toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <label className="text-sm font-medium">
            Background mirrors RP scene
          </label>
          <Button
            variant={settings.sceneBackgroundFromRP ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              updateSetting(
                'sceneBackgroundFromRP',
                !settings.sceneBackgroundFromRP
              )
            }
            aria-pressed={settings.sceneBackgroundFromRP}
            disabled={!settings.enabled}
          >
            {settings.sceneBackgroundFromRP ? 'ON' : 'OFF'}
          </Button>
        </div>

        {/* Room overlays toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <label className="text-sm font-medium">
            Room overlays (location silhouettes)
          </label>
          <Button
            variant={settings.sceneRoomOverlaysEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              updateSetting(
                'sceneRoomOverlaysEnabled',
                !settings.sceneRoomOverlaysEnabled
              )
            }
            aria-pressed={settings.sceneRoomOverlaysEnabled}
            disabled={!settings.enabled}
          >
            {settings.sceneRoomOverlaysEnabled ? 'ON' : 'OFF'}
          </Button>
        </div>

        {/* Parallax Intensity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Parallax Intensity</label>
            <span className="text-xs text-muted-foreground">
              {settings.parallaxIntensity}
            </span>
          </div>
          <Slider
            value={[settings.parallaxIntensity]}
            onValueChange={([value]) => {
              updateSetting('parallaxIntensity', value);
              updateSetting('enableParallax', value > 0);
            }}
            min={0}
            max={75}
            step={5}
            disabled={!settings.enabled || reducedMotion}
            className="w-full"
          />
        </div>

        {/* Particle Density Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Particle Density</label>
            <span className="text-xs text-muted-foreground capitalize">
              {settings.particleDensity}
            </span>
          </div>
          <Slider
            value={[particleDensityIndex]}
            onValueChange={([index]) => {
              const density = particleDensityValues[index];
              updateSetting('particleDensity', density);
              updateSetting('enableParticles', density !== 'off');
            }}
            min={0}
            max={3}
            step={1}
            disabled={!settings.enabled || reducedMotion}
            className="w-full"
          />
        </div>

        {/* Animation Speed Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Animation Speed</label>
            <span className="text-xs text-muted-foreground">
              {(settings.animationSpeed * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[settings.animationSpeed * 100]}
            onValueChange={([value]) =>
              updateSetting('animationSpeed', value / 100)
            }
            min={50}
            max={150}
            step={25}
            disabled={!settings.enabled || reducedMotion}
            className="w-full"
          />
        </div>

        {/* Reduced Motion Indicator (Read-only) */}
        <div className="flex items-center justify-between pt-2 border-t">
          <label className="text-sm font-medium">Reduced Motion</label>
          <span
            className={`text-sm font-medium ${reducedMotion ? 'text-yellow-500' : 'text-muted-foreground'}`}
          >
            {reducedMotion ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* Dev Debug Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <label className="text-sm font-medium">Dev Debug Overlay</label>
          <Button
            variant={settings.devDebug ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateSetting('devDebug', !settings.devDebug)}
            aria-pressed={settings.devDebug}
          >
            {settings.devDebug ? 'ON' : 'OFF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
