import { Card } from "@/components/ui/card";
import { PersonalityMode, getSystemStatus, personalityModes, ETHICAL_FRAMEWORK } from "@/lib/MillaCore";

interface SidebarProps {
  currentPersonalityMode: PersonalityMode;
}

export default function Sidebar({ currentPersonalityMode }: SidebarProps) {
  const systemStatus = getSystemStatus();

  const personalityModeNames = {
    coach: "Coach Mode",
    empathetic: "Empathetic Listener", 
    strategic: "Strategic Advisor",
    creative: "Creative Partner"
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

          {/* Ethical Framework */}
          <Card className="bg-muted/10 border border-border">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-primary mb-3">
                <i className="fas fa-shield-alt mr-2"></i>Ethical Framework
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 text-xs mt-0.5 mr-2"></i>
                  <span>{ETHICAL_FRAMEWORK.privacy.principle}</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 text-xs mt-0.5 mr-2"></i>
                  <span>{ETHICAL_FRAMEWORK.wellbeing.principle}</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 text-xs mt-0.5 mr-2"></i>
                  <span>{ETHICAL_FRAMEWORK.communication.principle}</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Project Leadership */}
          <Card className="bg-muted/10 border border-border">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-primary mb-3">
                <i className="fas fa-users mr-2"></i>Project Leadership
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-user-circle text-primary"></i>
                  <div>
                    <p className="font-medium text-foreground">Danny Clark</p>
                    <p className="text-xs">CEO / Visionary</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-user-circle text-primary"></i>
                  <div>
                    <p className="font-medium text-foreground">Gem</p>
                    <p className="text-xs">COO / Strategist</p>
                  </div>
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
