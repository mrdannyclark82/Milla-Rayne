import millaRealistic from "@assets/generated_images/Hyper-realistic_Milla_full_body_dbd5d6ca.png";

export type AvatarState = "neutral" | "thinking" | "responding";

interface AvatarSidebarProps {
  avatarState?: AvatarState;
}

export default function AvatarSidebar({ avatarState = "neutral" }: AvatarSidebarProps) {
  return (
    <aside className="w-80 bg-background flex flex-col h-full" data-testid="avatar-sidebar">
      {/* Seamless full-height avatar container */}
      <div className="flex-1 flex items-center justify-center p-0">
        <div className="w-full h-full">
          {/* Hyper-realistic Full Body Avatar */}
          <div className="w-full h-full overflow-hidden">
            <img 
              src={millaRealistic} 
              alt="Milla" 
              className="w-full h-full object-cover object-center transition-all duration-300 ease-in-out"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}