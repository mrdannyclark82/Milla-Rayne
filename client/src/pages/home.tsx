import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import AvatarSidebar, { AvatarState } from "@/components/AvatarSidebar";
import { PersonalityMode } from "@/lib/MillaCore";
import millaRealistic from "@assets/generated_images/Hyper-realistic_Milla_full_body_dbd5d6ca.png";
import millaThoughtful from "@assets/generated_images/Milla_thoughtful_expression_avatar_dbb1829b.png";
import millaSmiling from "@assets/generated_images/Milla_smiling_expression_avatar_4945ceea.png";
import { Button } from "@/components/ui/button";
import SettingsPanel from "@/components/SettingsPanel";

export default function Home() {
  const [currentPersonalityMode, setCurrentPersonalityMode] = useState<PersonalityMode>("empathetic");
  const [avatarState, setAvatarState] = useState<AvatarState>("neutral");
  
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
      {/* Left Side - Avatar Video Background */}
      <div className="flex-1 relative overflow-hidden">
        {/* Video Background Placeholder - Will be replaced with actual video */}
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${getAvatarImage()})`,
          }}
        >
          {/* Optional overlay for better video visibility */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        {/* Settings Panel */}
        <SettingsPanel>
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
        <ChatInterface onPersonalityModeChange={setCurrentPersonalityMode} onAvatarStateChange={setAvatarState} />
      </div>
    </div>
  );
}
