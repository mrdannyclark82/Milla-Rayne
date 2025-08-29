import millaFullBody from "@assets/generated_images/Milla_full_body_avatar_1dc20b78.png";

export type AvatarState = "neutral" | "thinking" | "responding";

interface AvatarSidebarProps {
  avatarState?: AvatarState;
}

export default function AvatarSidebar({ avatarState = "neutral" }: AvatarSidebarProps) {
  return (
    <aside className="w-80 bg-background border-r border-border flex flex-col h-full" data-testid="avatar-sidebar">
      {/* Full height avatar container */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          {/* Full Body Avatar */}
          <div className="w-64 h-80 mx-auto overflow-hidden shadow-2xl rounded-2xl border-2 border-primary/20 mb-6">
            <img 
              src={millaFullBody} 
              alt="Milla Full Body Avatar" 
              className="w-full h-full object-cover object-top transition-all duration-300 ease-in-out"
            />
          </div>
          
          {/* Status Indicator */}
          <div className="relative inline-block mb-4">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
          </div>
          
          {/* Avatar Info */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Milla</h2>
            <p className="text-muted-foreground text-lg">Advanced AI Assistant</p>
            
            {/* Dynamic Status Text */}
            <div className="mt-4">
              {avatarState === "thinking" && (
                <p className="text-sm text-blue-400 animate-pulse">Thinking...</p>
              )}
              {avatarState === "responding" && (
                <p className="text-sm text-green-400 animate-pulse">Responding...</p>
              )}
              {avatarState === "neutral" && (
                <p className="text-sm text-muted-foreground">Ready to help</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}