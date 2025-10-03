import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DeveloperModeToggleProps {
  children?: React.ReactNode;
}

export default function DeveloperModeToggle({ children }: DeveloperModeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [isDeveloperModeLoading, setIsDeveloperModeLoading] = useState(false);

  // Fetch developer mode status when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchDeveloperModeStatus();
    }
  }, [isOpen]);

  const fetchDeveloperModeStatus = async () => {
    try {
      const response = await fetch('/api/developer-mode/status');
      const data = await response.json();
      if (data.success) {
        setDeveloperMode(data.enabled);
      }
    } catch (error) {
      console.error('Error fetching developer mode status:', error);
    }
  };

  const handleDeveloperModeToggle = async () => {
    setIsDeveloperModeLoading(true);
    try {
      const newState = !developerMode;
      const response = await fetch('/api/developer-mode/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: newState }),
      });

      const data = await response.json();
      if (data.success) {
        setDeveloperMode(newState);
      }
    } catch (error) {
      console.error('Error toggling developer mode:', error);
    } finally {
      setIsDeveloperModeLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-black/90 backdrop-blur-md border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-code text-purple-400"></i>
            Developer Mode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Developer Mode Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-code-branch mr-2 text-purple-400"></i>
                Developer Mode Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-white/70 mb-3">
                Enable Developer Mode to allow Milla to automatically discuss repository analysis, code improvements, and development features during conversations.
              </p>
              
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
                    Developer Mode
                    {developerMode ? (
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/50">
                        Enabled
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-500/50">
                        Disabled
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-white/60">
                    {developerMode 
                      ? "Milla can discuss GitHub repositories and code analysis automatically"
                      : "Milla will only discuss development when explicitly asked"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDeveloperModeToggle}
                  disabled={isDeveloperModeLoading}
                  className={`ml-4 border-white/30 text-white/70 hover:text-white ${
                    developerMode ? 'bg-purple-600/20 border-purple-400/50 text-purple-300' : ''
                  }`}
                >
                  <i className={`fas ${developerMode ? 'fa-toggle-on' : 'fa-toggle-off'} mr-2 text-xl`}></i>
                  {isDeveloperModeLoading ? 'Updating...' : (developerMode ? 'On' : 'Off')}
                </Button>
              </div>

              <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30">
                <p className="text-sm text-purple-300 flex items-start gap-2">
                  <i className="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                  <span>
                    When enabled, Milla can automatically analyze GitHub URLs you share and discuss code improvements. 
                    When disabled, she'll only engage with development topics when you explicitly ask.
                  </span>
                </p>
              </div>

              <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
                <h5 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                  <i className="fas fa-lightbulb"></i>
                  What Developer Mode Enables:
                </h5>
                <ul className="text-xs text-blue-200 space-y-1 ml-6 list-disc">
                  <li>Automatic GitHub repository analysis</li>
                  <li>Code improvement suggestions</li>
                  <li>Development feature discussions</li>
                  <li>Repository insights and recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setIsOpen(false)}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
