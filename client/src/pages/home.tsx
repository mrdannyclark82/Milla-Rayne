import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
            className="bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-logout"
            title="Log Out"
          >
            <i className="fas fa-sign-out-alt text-sm"></i>
          </Button>
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
