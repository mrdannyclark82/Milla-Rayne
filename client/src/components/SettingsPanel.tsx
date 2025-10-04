import { useState, useEffect } from "react";
import { Shield, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AvatarCustomizer } from "./AvatarCustomizer";
import { AccessibilitySettings } from "./AccessibilitySettings";
import { SceneSettingsPanel } from "./scene/SceneSettingsPanel";

type AvatarSettings = {
  style: 'realistic' | 'anime' | 'artistic' | 'minimal';
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  outfit: 'casual' | 'elegant' | 'professional' | 'intimate';
  expression: 'loving' | 'playful' | 'mysterious' | 'gentle';
  background: 'gradient' | 'solid' | 'nature' | 'abstract';
  lighting: number;
  glow: number;
};

interface SettingsPanelProps {
  children?: React.ReactNode;
  voiceEnabled?: boolean;
  onVoiceToggle?: (enabled: boolean) => void;
  speechRate?: number;
  onSpeechRateChange?: (rate: number) => void;
  voicePitch?: number;
  onVoicePitchChange?: (pitch: number) => void;
  voiceVolume?: number;
  onVoiceVolumeChange?: (volume: number) => void;
  selectedVoice?: SpeechSynthesisVoice | null;
  onVoiceChange?: (voice: SpeechSynthesisVoice | null) => void;
  availableVoices?: SpeechSynthesisVoice[];
  avatarSettings?: AvatarSettings;
  onAvatarSettingsChange?: (settings: AvatarSettings) => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  backgroundBlur?: number;
  onBackgroundBlurChange?: (blur: number) => void;
  chatTransparency?: number;
  onChatTransparencyChange?: (transparency: number) => void;
  personalitySettings?: {
    communicationStyle: 'adaptive' | 'formal' | 'casual' | 'friendly';
    formalityLevel: 'formal' | 'balanced' | 'casual';
    responseLength: 'short' | 'medium' | 'long';
    emotionalIntelligence: 'low' | 'medium' | 'high';
  };
  onPersonalitySettingsChange?: (settings: any) => void;
}

export default function SettingsPanel({
  children,
  voiceEnabled = false,
  onVoiceToggle,
  speechRate = 1.0,
  onSpeechRateChange,
  voicePitch = 1.1,
  onVoicePitchChange,
  voiceVolume = 0.8,
  onVoiceVolumeChange,
  selectedVoice = null,
  onVoiceChange,
  availableVoices = [],
  avatarSettings: externalAvatarSettings,
  onAvatarSettingsChange,
  theme = 'dark',
  onThemeChange,
  backgroundBlur = 75,
  onBackgroundBlurChange,
  chatTransparency = 80,
  onChatTransparencyChange,
  personalitySettings,
  onPersonalitySettingsChange
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceConsents, setVoiceConsents] = useState<{
    voice_synthesis: boolean;
    voice_persona: boolean;
    voice_cloning: boolean;
  }>({
    voice_synthesis: false,
    voice_persona: false,
    voice_cloning: false,
  });
  const [developerMode, setDeveloperMode] = useState(false);
  const [isDeveloperModeLoading, setIsDeveloperModeLoading] = useState(false);

  const defaultAvatarSettings: AvatarSettings = {
    style: 'realistic',
    hairColor: 'auburn',
    eyeColor: 'green',
    skinTone: 'warm',
    outfit: 'elegant',
    expression: 'loving',
    background: 'gradient',
    lighting: 75,
    glow: 60
  };

  const defaultPersonalitySettings = {
    communicationStyle: 'adaptive' as const,
    formalityLevel: 'balanced' as const,
    responseLength: 'medium' as const,
    emotionalIntelligence: 'high' as const
  };

  const avatarSettings = externalAvatarSettings || defaultAvatarSettings;
  const currentPersonalitySettings = personalitySettings || defaultPersonalitySettings;

  const handleVoiceToggle = () => {
    onVoiceToggle?.(!voiceEnabled);
  };

  const handleSpeechRateChange = () => {
    const newRate = speechRate >= 1.5 ? 0.75 : speechRate + 0.25;
    onSpeechRateChange?.(newRate);
  };

  const getSpeechRateLabel = () => {
    if (speechRate <= 0.75) return "Slow";
    if (speechRate >= 1.5) return "Fast";
    return "Normal";
  };

  const handleVoicePitchChange = () => {
    const newPitch = voicePitch >= 1.5 ? 0.8 : voicePitch + 0.1;
    onVoicePitchChange?.(Math.round(newPitch * 10) / 10);
  };

  const getVoicePitchLabel = () => {
    if (voicePitch <= 0.8) return "Low";
    if (voicePitch >= 1.4) return "High";
    return "Normal";
  };

  const handleVoiceVolumeChange = () => {
    const newVolume = voiceVolume >= 1.0 ? 0.3 : voiceVolume + 0.2;
    onVoiceVolumeChange?.(Math.round(newVolume * 10) / 10);
  };

  const getVoiceVolumeLabel = () => {
    if (voiceVolume <= 0.4) return "Quiet";
    if (voiceVolume >= 0.9) return "Loud";
    return "Normal";
  };

  const handleVoiceChange = (voiceName: string) => {
    const voice = availableVoices.find(v => v.name === voiceName) || null;
    onVoiceChange?.(voice);
  };

  const getVoiceDisplayName = () => {
    if (!selectedVoice) return "Auto (Female)";
    const shortName = selectedVoice.name.split(' ')[0] || selectedVoice.name;
    return shortName.length > 12 ? shortName.substring(0, 12) + '...' : shortName;
  };

  // Fetch voice consents when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchVoiceConsents();
      fetchDeveloperModeStatus();
    }
  }, [isOpen]);

  const fetchDeveloperModeStatus = async () => {
    try {
      const response = await fetch('/api/developer-mode/status');
      const data = await response.json();
      if (data.success) {
        setDeveloperMode(data.enabled);
      }
    } catch (error) {
      console.error('Error fetching developer mode status:', error);
    }
  };

  const handleDeveloperModeToggle = async () => {
    setIsDeveloperModeLoading(true);
    try {
      const newState = !developerMode;
      const response = await fetch('/api/developer-mode/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: newState }),
      });

      const data = await response.json();
      if (data.success) {
        setDeveloperMode(newState);
      }
    } catch (error) {
      console.error('Error toggling developer mode:', error);
    } finally {
      setIsDeveloperModeLoading(false);
    }
  };

  const fetchVoiceConsents = async () => {
    try {
      const types: ('voice_synthesis' | 'voice_persona' | 'voice_cloning')[] = [
        'voice_synthesis',
        'voice_persona',
        'voice_cloning'
      ];

      const results = await Promise.all(
        types.map(type =>
          fetch(`/api/voice-consent/check/${type}`)
            .then(res => res.json())
            .catch(() => ({ hasConsent: false }))
        )
      );

      setVoiceConsents({
        voice_synthesis: results[0]?.hasConsent || false,
        voice_persona: results[1]?.hasConsent || false,
        voice_cloning: results[2]?.hasConsent || false,
      });
    } catch (error) {
      console.error('Error fetching voice consents:', error);
    }
  };

  const handleRevokeConsent = async (consentType: string) => {
    try {
      const response = await fetch('/api/voice-consent/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consentType }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh consent status
        fetchVoiceConsents();

        // If voice synthesis consent was revoked, disable voice
        if (consentType === 'voice_synthesis' && voiceEnabled) {
          onVoiceToggle?.(false);
        }
      }
    } catch (error) {
      console.error('Error revoking consent:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto bg-black/80 backdrop-blur-md border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* Appearance Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-palette mr-2 text-purple-400"></i>
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Theme</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-white/30 text-white/70 hover:text-white ${theme === 'light' ? 'bg-white/20 border-white/50' : ''
                      }`}
                    onClick={() => onThemeChange?.('light')}
                    data-testid="button-theme-light"
                  >
                    <i className="fas fa-sun mr-1"></i>
                    Light
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`border-white/30 text-white/70 hover:text-white ${theme === 'dark' ? 'bg-white/20 border-white/50' : ''
                      }`}
                    onClick={() => onThemeChange?.('dark')}
                    data-testid="button-theme-dark"
                  >
                    <i className="fas fa-moon mr-1"></i>
                    Dark
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Background Blur</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={backgroundBlur}
                    onChange={(e) => onBackgroundBlurChange?.(Number(e.target.value))}
                    className="w-20 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    data-testid="slider-background-blur"
                  />
                  <span className="text-white/60 text-xs w-8">{backgroundBlur}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Chat Transparency</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={chatTransparency}
                    onChange={(e) => onChatTransparencyChange?.(Number(e.target.value))}
                    className="w-20 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    data-testid="slider-chat-transparency"
                  />
                  <span className="text-white/60 text-xs w-8">{chatTransparency}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Customization Section */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <AvatarCustomizer
              currentSettings={avatarSettings}
              onSettingsChange={onAvatarSettingsChange || (() => { })}
            />
          </div>

          {/* Personality Tuning Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-brain mr-2 text-blue-400"></i>
                Personality Tuning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Communication Style</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white/70 hover:text-white"
                  onClick={() => {
                    const styles = ['adaptive', 'formal', 'casual', 'friendly'] as const;
                    const currentIndex = styles.indexOf(currentPersonalitySettings.communicationStyle);
                    const nextStyle = styles[(currentIndex + 1) % styles.length];
                    onPersonalitySettingsChange?.({ ...currentPersonalitySettings, communicationStyle: nextStyle });
                  }}
                  data-testid="button-communication-style"
                >
                  <i className="fas fa-comments mr-1"></i>
                  {currentPersonalitySettings.communicationStyle.charAt(0).toUpperCase() + currentPersonalitySettings.communicationStyle.slice(1)}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Formality Level</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white/70 hover:text-white"
                  onClick={() => {
                    const levels = ['formal', 'balanced', 'casual'] as const;
                    const currentIndex = levels.indexOf(currentPersonalitySettings.formalityLevel);
                    const nextLevel = levels[(currentIndex + 1) % levels.length];
                    onPersonalitySettingsChange?.({ ...currentPersonalitySettings, formalityLevel: nextLevel });
                  }}
                  data-testid="button-formality-level"
                >
                  <i className="fas fa-balance-scale mr-1"></i>
                  {currentPersonalitySettings.formalityLevel.charAt(0).toUpperCase() + currentPersonalitySettings.formalityLevel.slice(1)}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Response Length</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white/70 hover:text-white"
                  onClick={() => {
                    const lengths = ['short', 'medium', 'long'] as const;
                    const currentIndex = lengths.indexOf(currentPersonalitySettings.responseLength);
                    const nextLength = lengths[(currentIndex + 1) % lengths.length];
                    onPersonalitySettingsChange?.({ ...currentPersonalitySettings, responseLength: nextLength });
                  }}
                  data-testid="button-response-length"
                >
                  <i className="fas fa-text-width mr-1"></i>
                  {currentPersonalitySettings.responseLength.charAt(0).toUpperCase() + currentPersonalitySettings.responseLength.slice(1)}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Emotional Intelligence</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white/70 hover:text-white"
                  onClick={() => {
                    const levels = ['low', 'medium', 'high'] as const;
                    const currentIndex = levels.indexOf(currentPersonalitySettings.emotionalIntelligence);
                    const nextLevel = levels[(currentIndex + 1) % levels.length];
                    onPersonalitySettingsChange?.({ ...currentPersonalitySettings, emotionalIntelligence: nextLevel });
                  }}
                  data-testid="button-emotional-intelligence"
                >
                  <i className="fas fa-heart mr-1"></i>
                  {currentPersonalitySettings.emotionalIntelligence.charAt(0).toUpperCase() + currentPersonalitySettings.emotionalIntelligence.slice(1)}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Voice Settings Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-volume-up mr-2 text-green-400"></i>
                Voice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Voice Responses</span>
                <Button
                  variant="outline"
                  size="sm"
                  className={`border-white/30 text-white/70 hover:text-white ${voiceEnabled ? 'bg-green-600/20 border-green-400/50 text-green-300' : ''}`}
                  onClick={handleVoiceToggle}
                  data-testid="button-voice-toggle"
                >
                  <i className={`fas ${voiceEnabled ? 'fa-toggle-on' : 'fa-toggle-off'} mr-1`}></i>
                  {voiceEnabled ? 'On' : 'Off'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Voice Input</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-microphone mr-1"></i>
                  Available
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Speech Rate</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white/70 hover:text-white"
                  onClick={handleSpeechRateChange}
                  data-testid="button-speech-rate"
                >
                  <i className="fas fa-tachometer-alt mr-1"></i>
                  {getSpeechRateLabel()}
                </Button>
              </div>

              {voiceEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Voice Selection</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white/70 hover:text-white"
                      onClick={() => {
                        const femaleVoices = availableVoices.filter(v =>
                          v.lang.startsWith('en') &&
                          (v.name.toLowerCase().includes('female') ||
                            v.name.toLowerCase().includes('woman') ||
                            v.name.toLowerCase().includes('zira') ||
                            v.name.toLowerCase().includes('hazel') ||
                            v.name.toLowerCase().includes('samantha'))
                        );
                        const allEnglishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
                        const voicesToCycle = femaleVoices.length > 0 ? femaleVoices : allEnglishVoices;

                        if (voicesToCycle.length === 0) return;

                        const currentIndex = selectedVoice ? voicesToCycle.findIndex(v => v.name === selectedVoice.name) : -1;
                        const nextIndex = (currentIndex + 1) % voicesToCycle.length;
                        onVoiceChange?.(voicesToCycle[nextIndex]);
                      }}
                      data-testid="button-voice-picker"
                    >
                      <i className="fas fa-user-circle mr-1"></i>
                      {getVoiceDisplayName()}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Voice Pitch</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white/70 hover:text-white"
                      onClick={handleVoicePitchChange}
                      data-testid="button-voice-pitch"
                    >
                      <i className="fas fa-music mr-1"></i>
                      {getVoicePitchLabel()}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Voice Volume</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white/70 hover:text-white"
                      onClick={handleVoiceVolumeChange}
                      data-testid="button-voice-volume"
                    >
                      <i className="fas fa-volume-up mr-1"></i>
                      {getVoiceVolumeLabel()}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Privacy & Consent Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-400" />
                Privacy & Consent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-white/60 mb-3">
                Manage your consent for voice features. You can revoke consent at any time.
              </p>

              {/* Voice Synthesis Consent */}
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      Voice Synthesis
                      {voiceConsents.voice_synthesis ? (
                        <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/50">
                          Granted
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-500/50">
                          Not Granted
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-white/60 mt-1">
                      Text-to-speech output for AI responses
                    </p>
                  </div>
                </div>
                {voiceConsents.voice_synthesis && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeConsent('voice_synthesis')}
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 mt-2"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Revoke Consent
                  </Button>
                )}
              </div>

              {/* Voice Persona Consent */}
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      Voice Persona
                      {voiceConsents.voice_persona ? (
                        <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/50">
                          Granted
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-500/50">
                          Not Granted
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-white/60 mt-1">
                      Custom voice characteristics and preferences
                    </p>
                  </div>
                </div>
                {voiceConsents.voice_persona && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeConsent('voice_persona')}
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 mt-2"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Revoke Consent
                  </Button>
                )}
              </div>

              {/* Voice Cloning Consent */}
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      Voice Cloning
                      {voiceConsents.voice_cloning ? (
                        <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/50">
                          Granted
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/50">
                          Not Available
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-white/60 mt-1">
                      Synthetic voice generation (Not yet implemented)
                    </p>
                  </div>
                </div>
                {voiceConsents.voice_cloning && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeConsent('voice_cloning')}
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 mt-2"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Revoke Consent
                  </Button>
                )}
              </div>

              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30 mt-3">
                <p className="text-xs text-blue-300 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Your privacy matters. All consent records are stored securely and you can revoke consent at any time.
                    See <span className="underline cursor-pointer">VOICE_CLONING_CONSENT.md</span> for details.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Developer Mode Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-code mr-2 text-purple-400"></i>
                Developer Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-white/60 mb-3">
                Enable Developer Mode to allow Milla to automatically discuss repository analysis, code improvements, and development features during conversations.
              </p>
              
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    Developer Mode
                    {developerMode ? (
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/50">
                        Enabled
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-500/50">
                        Disabled
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-white/60 mt-1">
                    {developerMode 
                      ? "Milla can discuss GitHub repositories and code analysis automatically"
                      : "Milla will only discuss development when explicitly asked"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeveloperModeToggle}
                  disabled={isDeveloperModeLoading}
                  className={`ml-3 border-white/30 text-white/70 hover:text-white ${
                    developerMode ? 'bg-purple-600/20 border-purple-400/50 text-purple-300' : ''
                  }`}
                  data-testid="button-developer-mode-toggle"
                >
                  <i className={`fas ${developerMode ? 'fa-toggle-on' : 'fa-toggle-off'} mr-1`}></i>
                  {isDeveloperModeLoading ? 'Updating...' : (developerMode ? 'On' : 'Off')}
                </Button>
              </div>

              <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30 mt-3">
                <p className="text-xs text-purple-300 flex items-start gap-2">
                  <i className="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                  <span>
                    When enabled, Milla can automatically analyze GitHub URLs you share and discuss code improvements. 
                    When disabled, she'll only engage with development topics when you explicitly ask.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Tasks Section */}
          \n\n          <PersonalTasksSection />

          {/* Accessibility Section */}
          <AccessibilitySettings
            highContrast={false}
            onHighContrastChange={() => { }}
            dyslexiaFont={false}
            onDyslexiaFontChange={() => { }}
            colorBlindMode="none"
            onColorBlindModeChange={() => { }}
            largeTouchTargets={false}
            onLargeTouchTargetsChange={() => { }}
          />

          {/* Scene Settings Section */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <SceneSettingsPanel />
          </div>
        </div>

        <Separator className="bg-white/20" />

        {/* Footer */}
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-white/30 text-white/70 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Personal Tasks Section Component
interface PersonalTask {
  id: string;
  type: 'self_reflection' | 'improvement' | 'glitch_analysis' | 'memory_processing' | 'relationship_growth' | 'creative_exploration' | 'diary_entry';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  createdAt: string;
  completedAt?: string;
  insights?: string;
  status: 'pending' | 'in_progress' | 'completed';
  basedOnInteraction?: string;
}

interface TaskSummary {
  pending: number;
  inProgress: number;
  completed: number;
}

function PersonalTasksSection() {
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);

  const { data: tasksData } = useQuery<{ tasks: PersonalTask[]; success: boolean }>({
    queryKey: ["/api/personal-tasks"],
    refetchInterval: 30000,
  });

  const { data: summaryData } = useQuery<{ summary: TaskSummary; success: boolean }>({
    queryKey: ["/api/task-summary"],
    refetchInterval: 30000,
  });

  const tasks = tasksData?.tasks || [];
  const summary = summaryData?.summary || { pending: 0, inProgress: 0, completed: 0 };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'self_reflection': return 'fas fa-mirror';
      case 'improvement': return 'fas fa-arrow-up';
      case 'glitch_analysis': return 'fas fa-bug';
      case 'memory_processing': return 'fas fa-brain';
      case 'relationship_growth': return 'fas fa-heart';
      case 'creative_exploration': return 'fas fa-palette';
      case 'diary_entry': return 'fas fa-book';
      default: return 'fas fa-tasks';
    }
  };

  const startTask = async (taskId: string) => {
    try {
      await apiRequest(`/api/personal-tasks/${taskId}/start`, { method: 'POST' });
      window.location.reload();
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const completeTask = async (taskId: string, insights: string) => {
    try {
      await apiRequest(`/api/personal-tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ insights })
      });
      setSelectedTask(null);
      window.location.reload();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <i className="fas fa-brain mr-2 text-purple-400"></i>
          Milla's Personal Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Summary */}
        <div className="flex space-x-4 text-sm">
          <span className="text-yellow-400">
            <i className="fas fa-clock mr-1"></i>
            {summary.pending} pending
          </span>
          <span className="text-blue-400">
            <i className="fas fa-play mr-1"></i>
            {summary.inProgress} in progress
          </span>
          <span className="text-green-400">
            <i className="fas fa-check mr-1"></i>
            {summary.completed} completed
          </span>
        </div>

        {/* Recent Tasks */}
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center text-gray-400 py-4">
              <i className="fas fa-sleep text-xl mb-2"></i>
              <p className="text-sm">No personal tasks yet.</p>
              <p className="text-xs">Milla will generate tasks based on your interactions.</p>
            </div>
          ) : (
            tasks
              .filter(task => task.status === 'pending' || task.status === 'in_progress')
              .slice(0, 3)
              .map((task) => (
                <div key={task.id} className="bg-white/5 border border-white/10 rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <i className={`${getTypeIcon(task.type)} text-purple-300 text-xs`}></i>
                        <span className="text-sm font-medium text-purple-200">{task.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2 line-clamp-2">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          <i className="fas fa-clock mr-1"></i>
                          {task.estimatedTime} min
                        </span>
                        {task.status === 'pending' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-300 hover:text-purple-200 text-xs h-6"
                            onClick={() => startTask(task.id)}
                          >
                            Start
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-300 hover:text-green-200 text-xs h-6"
                            onClick={() => setSelectedTask(task)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Task Completion Modal */}
        {selectedTask && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <Card className="bg-black/80 border border-purple-500/20 p-4 max-w-md w-full">
              <h4 className="text-purple-200 font-medium mb-2">Complete Task</h4>
              <p className="text-sm text-gray-300 mb-3">{selectedTask.title}</p>
              <textarea
                placeholder="What insights did Milla gain from this task?"
                className="w-full bg-transparent border border-purple-500/20 rounded p-2 text-sm text-white placeholder:text-gray-400 resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    const insights = (e.target as HTMLTextAreaElement).value;
                    completeTask(selectedTask.id, insights);
                  }
                }}
              />
              <div className="flex justify-end space-x-2 mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                    const insights = textarea?.value || "";
                    completeTask(selectedTask.id, insights);
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Complete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}