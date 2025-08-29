import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import AvatarSidebar, { AvatarState } from "@/components/AvatarSidebar";
import { PersonalityMode } from "@/lib/MillaCore";
import millaRealistic from "@assets/generated_images/Hyper-realistic_Milla_full_body_dbd5d6ca.png";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [currentPersonalityMode, setCurrentPersonalityMode] = useState<PersonalityMode>("empathetic");
  const [avatarState, setAvatarState] = useState<AvatarState>("neutral");

  return (
    <div 
      className="flex h-screen overflow-hidden text-white relative" 
      style={{
        backgroundImage: `url(${millaRealistic})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      data-testid="app-container"
    >
      {/* Subtle Settings Icon */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
        data-testid="button-settings"
      >
        <i className="fas fa-cog text-sm"></i>
      </Button>
      
      <ChatInterface onPersonalityModeChange={setCurrentPersonalityMode} onAvatarStateChange={setAvatarState} />
    </div>
  );
}
