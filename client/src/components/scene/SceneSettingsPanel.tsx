/**
 * Scene Settings Panel
 * User controls for adaptive background settings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SceneSettings, SceneMood } from '@/types/scene';
import { loadSceneSettings, saveSceneSettings, onSettingsChange as subscribeToSettingsChange } from '@/utils/sceneSettingsStore';

interface SceneSettingsPanelProps {
  onSettingsChange?: (settings: SceneSettings) => void;
}

export const SceneSettingsPanel: React.FC<SceneSettingsPanelProps> = ({
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<SceneSettings>(() => loadSceneSettings());
  const [reducedMotion, setReducedMotion] = useState(false);

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
    const unsubscribe = subscribeToSettingsChange((newSettings: SceneSettings) => {
      setSettings(newSettings);
      if (onSettingsChange) {
        onSettingsChange(newSettings);
      }
    });
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
  };

  // Map particle density to display values
  const particleDensityValues = ['off', 'low', 'medium', 'high'] as const;
  const particleDensityIndex = particleDensityValues.indexOf(settings.particleDensity);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Adaptive Background</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Adaptive Background</label>
          <Button
            variant={settings.enabled ? "default" : "outline"}
            size="sm"
            onClick={() => updateSetting('enabled', !settings.enabled)}
            aria-pressed={settings.enabled}
          >
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {/* Mood Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mood</label>
          <Select
            value={settings.mood}
            onValueChange={(value) => updateSetting('mood', value as SceneMood)}
            disabled={!settings.enabled}
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
            onValueChange={([value]) => updateSetting('animationSpeed', value / 100)}
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
          <span className={`text-sm font-medium ${reducedMotion ? 'text-yellow-500' : 'text-muted-foreground'}`}>
            {reducedMotion ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* Dev Debug Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <label className="text-sm font-medium">Dev Debug Overlay</label>
          <Button
            variant={settings.devDebug ? "default" : "outline"}
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
