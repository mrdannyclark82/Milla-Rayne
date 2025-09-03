import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import AvatarSidebar, { AvatarState } from "@/components/AvatarSidebar";
import { DynamicAvatar } from "@/components/DynamicAvatar";
import millaRealistic from "@assets/generated_images/Hyper-realistic_Milla_full_body_dbd5d6ca.png";
import millaThoughtful from "@assets/generated_images/Milla_thoughtful_expression_avatar_dbb1829b.png";
import millaSmiling from "@assets/generated_images/Milla_smiling_expression_avatar_4945ceea.png";
import avatarVideo from "@assets/generated_images/AI_assistant_avatar_video_8218245c.png";
import millaPortraitVideo from "@assets/Creating_a_Living_Portrait_Animation_1756641116784.mp4";
import { Button } from "@/components/ui/button";
import SettingsPanel from "@/components/SettingsPanel";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

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

export default function Home() {
  const [avatarState, setAvatarState] = useState<AvatarState>("neutral");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.1);
  const [voiceVolume, setVoiceVolume] = useState(0.8);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  // Get available voices for voice picker
  const { voices: availableVoices } = useSpeechSynthesis();
  const [useVideo, setUseVideo] = useState(true);
  const [useCustomAvatar, setUseCustomAvatar] = useState(false);
  const [avatarSettings, setAvatarSettings] = useState<AvatarSettings>({
    style: 'realistic',
    hairColor: 'auburn',
    eyeColor: 'green',
    skinTone: 'warm',
    outfit: 'elegant',
    expression: 'loving',
    background: 'gradient',
    lighting: 75,
    glow: 60
  });
  
  // New settings state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [backgroundBlur, setBackgroundBlur] = useState(75);
  const [chatTransparency, setChatTransparency] = useState(80);
  const [personalitySettings, setPersonalitySettings] = useState({
    communicationStyle: 'adaptive' as 'adaptive' | 'formal' | 'casual' | 'friendly',
    formalityLevel: 'balanced' as 'formal' | 'balanced' | 'casual',
    responseLength: 'medium' as 'short' | 'medium' | 'long',
    emotionalIntelligence: 'high' as 'low' | 'medium' | 'high'
  });
  
  // Get the appropriate avatar image based on state
  const getAvatarImage = () => {
    switch (avatarState) {
      case "thinking":
        return millaThoughtful;
      case "responding":
        return millaSmiling;
      default:
        return millaRealistic;
    }
  };
  
  // Voice control handlers
  const handleVoiceChange = (voiceName: string) => {
    const voice = availableVoices.find(v => v.name === voiceName);
    setSelectedVoice(voice || null);
  };
  
  const handleVoicePitchChange = () => {
    const pitches = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4];
    const currentIndex = pitches.indexOf(voicePitch);
    const nextIndex = (currentIndex + 1) % pitches.length;
    setVoicePitch(pitches[nextIndex]);
  };
  
  const handleVoiceVolumeChange = () => {
    const volumes = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const currentIndex = volumes.indexOf(voiceVolume);
    const nextIndex = (currentIndex + 1) % volumes.length;
    setVoiceVolume(volumes[nextIndex]);
  };
  
  // Voice display helpers
  const getVoiceDisplayName = () => {
    if (!selectedVoice) return 'Default';
    return selectedVoice.name.split(' ')[0] || 'Default';
  };
  
  const getVoicePitchLabel = () => {
    if (voicePitch === 0.8) return 'Lower';
    if (voicePitch === 0.9) return 'Low';
    if (voicePitch === 1.0) return 'Normal';
    if (voicePitch === 1.1) return 'Sweet';
    if (voicePitch === 1.2) return 'High';
    if (voicePitch === 1.3) return 'Higher';
    if (voicePitch === 1.4) return 'Highest';
    return 'Custom';
  };
  
  const getVoiceVolumeLabel = () => {
    if (voiceVolume === 0.3) return 'Whisper';
    if (voiceVolume === 0.5) return 'Soft';
    if (voiceVolume === 0.7) return 'Normal';
    if (voiceVolume === 0.8) return 'Clear';
    if (voiceVolume === 1.0) return 'Loud';
    return Math.round(voiceVolume * 100) + '%';
  };

  return (
    <div 
      className={`flex h-screen overflow-hidden transition-all duration-500 ${
        theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-black text-white'
      }`} 
      data-testid="app-container"
      style={{
        backdropFilter: `blur(${backgroundBlur}px)`
      }}
    >
      {/* Left Side - Dynamic Avatar Video */}
      <div className="flex-1 relative overflow-hidden">
        {/* Dynamic Avatar with Video/Image/Custom */}
        <div className="relative w-full h-full overflow-hidden">
          {useCustomAvatar ? (
            <DynamicAvatar
              avatarState={avatarState}
              settings={avatarSettings}
              useVideo={false}
            />
          ) : useVideo ? (
            <video
              src={millaPortraitVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{
                filter: avatarState === 'thinking' ? 'brightness(0.8) saturate(1.2)' :
                        avatarState === 'responding' ? 'brightness(1.1) saturate(1.3)' :
                        'brightness(1) saturate(1)'
              }}
              data-testid="avatar-video"
            />
          ) : (
            <img
              src={getAvatarImage()}
              alt="Milla AI Assistant"
              className="w-full h-full object-cover avatar-breathing"
              style={{
                animation: `
                  breathing 4s ease-in-out infinite,
                  subtle-blink 6s infinite,
                  gentle-sway 8s ease-in-out infinite
                `
              }}
              data-testid="avatar-image"
            />
          )}
          {/* Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10"></div>
          
          {/* Dynamic glow effect based on avatar state */}
          <div 
            className={`absolute inset-0 transition-all duration-1000 ${
              avatarState === 'thinking' ? 'bg-blue-500/5' :
              avatarState === 'responding' ? 'bg-green-500/5' :
              'bg-purple-500/3'
            }`}
          />
        </div>
        
        {/* Settings Panel */}
        <SettingsPanel 
          voiceEnabled={voiceEnabled}
          onVoiceToggle={setVoiceEnabled}
          speechRate={speechRate}
          onSpeechRateChange={setSpeechRate}
          voicePitch={voicePitch}
          voiceVolume={voiceVolume}
          selectedVoice={selectedVoice}
          availableVoices={availableVoices}
          handleVoiceChange={handleVoiceChange}
          handleVoicePitchChange={handleVoicePitchChange}
          handleVoiceVolumeChange={handleVoiceVolumeChange}
          getVoiceDisplayName={getVoiceDisplayName}
          getVoicePitchLabel={getVoicePitchLabel}
          getVoiceVolumeLabel={getVoiceVolumeLabel}
          avatarSettings={avatarSettings}
          onAvatarSettingsChange={setAvatarSettings}
          theme={theme}
          onThemeChange={setTheme}
          backgroundBlur={backgroundBlur}
          onBackgroundBlurChange={setBackgroundBlur}
          chatTransparency={chatTransparency}
          onChatTransparencyChange={setChatTransparency}
          personalitySettings={personalitySettings}
          onPersonalitySettingsChange={setPersonalitySettings}
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 left-4 z-50 bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
            data-testid="button-settings"
          >
            <i className="fas fa-cog text-sm"></i>
          </Button>
        </SettingsPanel>
        
        {/* Avatar Mode Toggle Buttons */}
        <div className="absolute top-4 right-4 z-50 flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={`bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10 ${useCustomAvatar ? 'bg-purple-500/20 text-purple-300' : ''}`}
            onClick={() => setUseCustomAvatar(!useCustomAvatar)}
            data-testid="button-toggle-custom"
            title="Toggle Custom Avatar"
          >
            <i className="fas fa-palette text-sm"></i>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
            onClick={() => setUseVideo(!useVideo)}
            data-testid="button-toggle-avatar"
            title={useVideo ? "Switch to Image" : "Switch to Video"}
          >
            <i className={`fas ${useVideo ? 'fa-image' : 'fa-video'} text-sm`}></i>
          </Button>
        </div>
      </div>
      
      {/* Right Side - Dedicated Chat Container */}
      <div 
        className="w-96 flex flex-col transition-all duration-300 relative"
        style={{
          backgroundColor: theme === 'light' 
            ? `rgba(255, 255, 255, ${(100 - chatTransparency) / 100})` 
            : `rgba(0, 0, 0, ${(100 - chatTransparency) / 100})`,
          backdropFilter: `blur(${backgroundBlur / 4}px)`,
          border: chatTransparency < 50 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
        }}
      >
        <ChatInterface 
          onAvatarStateChange={setAvatarState}
          voiceEnabled={voiceEnabled}
          speechRate={speechRate}
          theme={theme}
          chatTransparency={chatTransparency}
          personalitySettings={personalitySettings}
        />
      </div>
    </div>
  );
}
