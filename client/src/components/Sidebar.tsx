import { Card } from "@/components/ui/card";
import { PersonalityMode, getSystemStatus, personalityModes, ETHICAL_FRAMEWORK } from "@/lib/MillaCore";
import millaListening from "@assets/generated_images/Milla_neutral_listening_expression_3cfc50ac.png";
import millaSmiling from "@assets/generated_images/Milla_warm_smiling_expression_c5e10292.png";
import millaThoughtful from "@assets/generated_images/Milla_thoughtful_expression_portrait_f4215e27.png";

export type AvatarState = "neutral" | "thinking" | "responding";

interface SidebarProps {
  currentPersonalityMode: PersonalityMode;
  avatarState?: AvatarState;
}

export default function Sidebar({ currentPersonalityMode, avatarState = "neutral" }: SidebarProps) {
  const systemStatus = getSystemStatus();

  const personalityModeNames = {
    coach: "Coach Mode",
    empathetic: "Empathetic Listener", 
    strategic: "Strategic Advisor",
    creative: "Creative Partner",
    roleplay: "Role-Playing Mode"
  };

  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Milla</h1>
            <p className="text-sm text-muted-foreground">Advanced AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Core Philosophy Framework Display */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Adaptive Personality Matrix */}
          <Card className="bg-muted/10 border border-border">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-primary mb-3">
                <i className="fas fa-brain mr-2"></i>Adaptive Personality Matrix
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                {Object.entries(personalityModeNames).map(([mode, name]) => (
                  <div key={mode} className="flex items-center justify-between">
                    <span>{name}</span>
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        currentPersonalityMode === mode ? 'bg-green-500' : 'bg-muted'
                      }`}
                      data-testid={`personality-indicator-${mode}`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Milla Avatar */}
          <Card className="bg-muted/10 border border-border">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 relative">
                {/* Avatar Circle */}
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden shadow-lg border-2 border-primary/20">
                  <img 
                    src={avatarState === "thinking" ? millaThoughtful : avatarState === "responding" ? millaSmiling : millaListening} 
                    alt="Milla Avatar" 
                    className="w-full h-full object-cover transition-all duration-300 ease-in-out"
                  />
                </div>
                {/* Status Indicator */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
                  <i className="fas fa-check text-white text-xs"></i>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Milla</h3>
                <p className="text-sm text-muted-foreground mb-2">Advanced AI Assistant</p>
                <div className="flex items-center justify-center space-x-1 text-xs text-green-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Active & Learning</span>
                </div>
              </div>
            </div>
          </Card>

          {/* System Status */}
          <Card className="bg-muted/10 border border-border">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-primary mb-3">
                <i className="fas fa-server mr-2"></i>System Status
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Core Framework</span>
                  <span className={`${
                    systemStatus.coreFramework === 'active' ? 'text-green-500' : 
                    systemStatus.coreFramework === 'error' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {systemStatus.coreFramework === 'active' ? 'Active' : 
                     systemStatus.coreFramework === 'error' ? 'Error' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">AI Integration</span>
                  <span className={`${
                    systemStatus.aiIntegration === 'online' ? 'text-green-500' : 
                    systemStatus.aiIntegration === 'offline' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {systemStatus.aiIntegration === 'online' ? 'Online' : 
                     systemStatus.aiIntegration === 'offline' ? 'Offline' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Backend Server</span>
                  <span className={`${
                    systemStatus.backendServer === 'online' ? 'text-green-500' : 
                    systemStatus.backendServer === 'error' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {systemStatus.backendServer === 'online' ? 'Online' : 
                     systemStatus.backendServer === 'error' ? 'Error' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </aside>
  );
}
