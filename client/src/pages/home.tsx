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
    <div 
      className="flex h-screen overflow-hidden text-white relative" 
      style={{
        backgroundImage: `url(${getAvatarImage()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      data-testid="app-container"
    >
      {/* Settings Panel */}
      <SettingsPanel>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
          data-testid="button-settings"
        >
          <i className="fas fa-cog text-sm"></i>
        </Button>
      </SettingsPanel>
      
      <ChatInterface onPersonalityModeChange={setCurrentPersonalityMode} onAvatarStateChange={setAvatarState} />
    </div>
  );
}
