import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import Sidebar, { AvatarState } from "@/components/Sidebar";
import { PersonalityMode } from "@/lib/MillaCore";

export default function Home() {
  const [currentPersonalityMode, setCurrentPersonalityMode] = useState<PersonalityMode>("empathetic");
  const [avatarState, setAvatarState] = useState<AvatarState>("neutral");

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground" data-testid="app-container">
      <Sidebar currentPersonalityMode={currentPersonalityMode} avatarState={avatarState} />
      <ChatInterface onPersonalityModeChange={setCurrentPersonalityMode} onAvatarStateChange={setAvatarState} />
    </div>
  );
}
