import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AvatarSettings {
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

interface AvatarCustomizerProps {
  onSettingsChange: (settings: AvatarSettings) => void;
  currentSettings: AvatarSettings;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  onSettingsChange,
  currentSettings,
}) => {
  const [settings, setSettings] = useState<AvatarSettings>(currentSettings);

  const updateSetting = <K extends keyof AvatarSettings>(
    key: K,
    value: AvatarSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const presets = {
    classic: {
      style: 'realistic' as const,
      hairColor: 'auburn',
      eyeColor: 'green',
      skinTone: 'warm',
      outfit: 'elegant' as const,
      expression: 'loving' as const,
      background: 'gradient' as const,
      lighting: 75,
      glow: 60,
    },
    ethereal: {
      style: 'artistic' as const,
      hairColor: 'platinum',
      eyeColor: 'blue',
      skinTone: 'fair',
      outfit: 'intimate' as const,
      expression: 'mysterious' as const,
      background: 'abstract' as const,
      lighting: 90,
      glow: 80,
    },
    natural: {
      style: 'realistic' as const,
      hairColor: 'brunette',
      eyeColor: 'brown',
      skinTone: 'medium',
      outfit: 'casual' as const,
      expression: 'gentle' as const,
      background: 'nature' as const,
      lighting: 65,
      glow: 40,
    },
  };

  const applyPreset = (preset: keyof typeof presets) => {
    const newSettings = { ...settings, ...presets[preset] };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-pink-600 dark:text-pink-400">
          <i className="fas fa-palette mr-2"></i>
          Customize Milla's Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Presets */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Quick Presets
          </label>
          <div className="flex gap-2">
            {Object.keys(presets).map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset as keyof typeof presets)}
                className="capitalize"
                data-testid={`button-preset-${preset}`}
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>

        {/* Art Style */}
        <div>
          <label className="text-sm font-medium mb-2 block">Art Style</label>
          <Select
            value={settings.style}
            onValueChange={(value) =>
              updateSetting('style', value as AvatarSettings['style'])
            }
          >
            <SelectTrigger data-testid="select-art-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realistic">Realistic</SelectItem>
              <SelectItem value="anime">Anime</SelectItem>
              <SelectItem value="artistic">Artistic</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hair Color */}
        <div>
          <label className="text-sm font-medium mb-2 block">Hair Color</label>
          <Select
            value={settings.hairColor}
            onValueChange={(value) => updateSetting('hairColor', value)}
          >
            <SelectTrigger data-testid="select-hair-color">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auburn">Auburn</SelectItem>
              <SelectItem value="brunette">Brunette</SelectItem>
              <SelectItem value="blonde">Blonde</SelectItem>
              <SelectItem value="black">Black</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
              <SelectItem value="red">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Eye Color */}
        <div>
          <label className="text-sm font-medium mb-2 block">Eye Color</label>
          <Select
            value={settings.eyeColor}
            onValueChange={(value) => updateSetting('eyeColor', value)}
          >
            <SelectTrigger data-testid="select-eye-color">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="brown">Brown</SelectItem>
              <SelectItem value="hazel">Hazel</SelectItem>
              <SelectItem value="gray">Gray</SelectItem>
              <SelectItem value="amber">Amber</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Outfit */}
        <div>
          <label className="text-sm font-medium mb-2 block">Outfit Style</label>
          <Select
            value={settings.outfit}
            onValueChange={(value) =>
              updateSetting('outfit', value as AvatarSettings['outfit'])
            }
          >
            <SelectTrigger data-testid="select-outfit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="elegant">Elegant</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="intimate">Intimate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expression */}
        <div>
          <label className="text-sm font-medium mb-2 block">Expression</label>
          <Select
            value={settings.expression}
            onValueChange={(value) =>
              updateSetting('expression', value as AvatarSettings['expression'])
            }
          >
            <SelectTrigger data-testid="select-expression">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="loving">Loving</SelectItem>
              <SelectItem value="playful">Playful</SelectItem>
              <SelectItem value="mysterious">Mysterious</SelectItem>
              <SelectItem value="gentle">Gentle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lighting */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Lighting: {settings.lighting}%
          </label>
          <Slider
            value={[settings.lighting]}
            onValueChange={([value]) => updateSetting('lighting', value)}
            max={100}
            step={5}
            className="mt-2"
            data-testid="slider-lighting"
          />
        </div>

        {/* Glow Effect */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Glow Effect: {settings.glow}%
          </label>
          <Slider
            value={[settings.glow]}
            onValueChange={([value]) => updateSetting('glow', value)}
            max={100}
            step={5}
            className="mt-2"
            data-testid="slider-glow"
          />
        </div>

        {/* Background */}
        <div>
          <label className="text-sm font-medium mb-2 block">Background</label>
          <Select
            value={settings.background}
            onValueChange={(value) =>
              updateSetting('background', value as AvatarSettings['background'])
            }
          >
            <SelectTrigger data-testid="select-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="solid">Solid Color</SelectItem>
              <SelectItem value="nature">Nature Scene</SelectItem>
              <SelectItem value="abstract">Abstract Art</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview Text */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Milla will appear as a {settings.style} {settings.hairColor}-haired
            woman with
            {settings.eyeColor} eyes, wearing {settings.outfit} attire with a{' '}
            {settings.expression} expression against a {settings.background}{' '}
            background.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
