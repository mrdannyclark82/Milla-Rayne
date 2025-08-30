import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import AvatarSidebar, { AvatarState } from "@/components/AvatarSidebar";
import { PersonalityMode } from "@/lib/MillaCore";
import millaRealistic from "@assets/generated_images/Hyper-realistic_Milla_full_body_dbd5d6ca.png";
import millaThoughtful from "@assets/generated_images/Milla_thoughtful_expression_avatar_dbb1829b.png";
import millaSmiling from "@assets/generated_images/Milla_smiling_expression_avatar_4945ceea.png";
import avatarVideo from "@assets/generated_images/AI_assistant_avatar_video_8218245c.png";
import { Button } from "@/components/ui/button";
import SettingsPanel from "@/components/SettingsPanel";

export default function Home() {
  const [currentPersonalityMode, setCurrentPersonalityMode] = useState<PersonalityMode>("empathetic");
  const [avatarState, setAvatarState] = useState<AvatarState>("neutral");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  
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
    <div className="flex h-screen overflow-hidden bg-black text-white" data-testid="app-container">
      {/* Left Side - Dynamic Avatar Video */}
      <div className="flex-1 relative overflow-hidden">
        {/* Dynamic Avatar with CSS Animation Effects */}
        <div className="relative w-full h-full overflow-hidden">
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
            data-testid="avatar-video"
          />
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
      </div>
      
      {/* Right Side - Dedicated Chat Container */}
      <div className="w-96 bg-black/60 backdrop-blur-md border-l border-white/10 flex flex-col">
        <ChatInterface 
          onPersonalityModeChange={setCurrentPersonalityMode} 
          onAvatarStateChange={setAvatarState}
          voiceEnabled={voiceEnabled}
          speechRate={speechRate}
        />
      </div>
    </div>
  );
}
