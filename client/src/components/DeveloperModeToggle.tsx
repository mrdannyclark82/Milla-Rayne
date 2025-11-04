import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getPredictiveUpdatesEnabled,
  setPredictiveUpdatesEnabled,
  getDailySuggestionsEnabled,
  setDailySuggestionsEnabled,
  fetchDailySuggestion,
  manualFetchAIUpdates,
} from '@/utils/predictiveUpdatesClient';

interface DeveloperModeToggleProps {
  children?: React.ReactNode;
}

export default function DeveloperModeToggle({
  children,
}: DeveloperModeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [isDeveloperModeLoading, setIsDeveloperModeLoading] = useState(false);

  // Predictive Updates state
  const [predictiveUpdatesEnabled, setPredictiveUpdatesEnabledState] =
    useState(false);
  const [dailySuggestionsEnabled, setDailySuggestionsEnabledState] =
    useState(false);
  const [isFetchingUpdates, setIsFetchingUpdates] = useState(false);

  // Fetch developer mode status when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchDeveloperModeStatus();
      // Load predictive updates settings
      setPredictiveUpdatesEnabledState(getPredictiveUpdatesEnabled());
      setDailySuggestionsEnabledState(getDailySuggestionsEnabled());
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

  const handlePredictiveUpdatesToggle = () => {
    const newState = !predictiveUpdatesEnabled;
    setPredictiveUpdatesEnabled(newState);
    setPredictiveUpdatesEnabledState(newState);

    // If enabled, fetch daily suggestion on next app load
    if (newState) {
      console.log(
        'Predictive updates enabled - will fetch suggestions on app load'
      );
    }
  };

  const handleDailySuggestionsToggle = () => {
    const newState = !dailySuggestionsEnabled;
    setDailySuggestionsEnabled(newState);
    setDailySuggestionsEnabledState(newState);
  };

  const handleManualFetch = async () => {
    setIsFetchingUpdates(true);
    try {
      const result = await manualFetchAIUpdates();
      if (result.success) {
        console.log('AI updates fetched successfully:', result);
        alert('AI updates fetched successfully! Check console for details.');
      } else {
        console.error('Failed to fetch AI updates:', result.error);
        alert(`Failed to fetch AI updates: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during manual fetch:', error);
      alert('Error during manual fetch. Check console for details.');
    } finally {
      setIsFetchingUpdates(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-[#2d3e50] backdrop-blur-md border border-gray-600 text-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
            <i className="fas fa-wrench text-purple-400"></i>
            Developer Mode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Developer Mode Section */}
          <Card className="bg-[#2d3e50] backdrop-blur-sm border border-gray-600">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center">
                <i className="fas fa-code-branch mr-2 text-purple-400"></i>
                Developer Mode Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    Enable to allow Milla to automatically discuss repository analysis, code improvements, and development features.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDeveloperModeToggle}
                  disabled={isDeveloperModeLoading}
                  className={`ml-4 border-white/30 text-white/70 hover:text-white ${
                    developerMode
                      ? 'bg-purple-600/20 border-purple-400/50 text-purple-300'
                      : ''
                  }`}
                >
                  <i
                    className={`fas ${developerMode ? 'fa-toggle-on' : 'fa-toggle-off'} mr-2 text-xl`}
                  ></i>
                  {isDeveloperModeLoading
                    ? 'Updating...'
                    : developerMode
                      ? 'On'
                      : 'Off'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Predictive Updates Section */}
          <Card className="bg-[#2d3e50] backdrop-blur-sm border border-gray-600">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center">
                <i className="fas fa-brain mr-2 text-blue-400"></i>
                Predictive Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Predictive Updates Toggle */}
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
                    Predictive Updates
                    {predictiveUpdatesEnabled ? (
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
                    Automatically fetch AI-generated daily suggestions on app load.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePredictiveUpdatesToggle}
                  className={`ml-4 border-white/30 text-white/70 hover:text-white ${
                    predictiveUpdatesEnabled
                      ? 'bg-blue-600/20 border-blue-400/50 text-blue-300'
                      : ''
                  }`}
                >
                  <i
                    className={`fas ${predictiveUpdatesEnabled ? 'fa-toggle-on' : 'fa-toggle-off'} mr-2 text-xl`}
                  ></i>
                  {predictiveUpdatesEnabled ? 'On' : 'Off'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Daily Suggestions Scheduler Section */}
          <Card className="bg-[#2d3e50] backdrop-blur-sm border border-gray-600">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center">
                <i className="fas fa-calendar-day mr-2 text-green-400"></i>
                Daily Suggestions Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Daily Suggestions Toggle */}
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
                    Scheduler Preference
                    {dailySuggestionsEnabled ? (
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
                    Client preference for scheduled daily suggestions. Server must be configured separately.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDailySuggestionsToggle}
                  className={`ml-4 border-white/30 text-white/70 hover:text-white ${
                    dailySuggestionsEnabled
                      ? 'bg-green-600/20 border-green-400/50 text-green-300'
                      : ''
                  }`}
                >
                  <i
                    className={`fas ${dailySuggestionsEnabled ? 'fa-toggle-on' : 'fa-toggle-off'} mr-2 text-xl`}
                  ></i>
                  {dailySuggestionsEnabled ? 'On' : 'Off'}
                </Button>
              </div>

              {/* Fetch Now Button inside Daily Suggestions */}
              {predictiveUpdatesEnabled && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={handleManualFetch}
                    disabled={isFetchingUpdates}
                    className="bg-blue-600/20 border-blue-400/50 text-blue-300 hover:bg-blue-600/30"
                  >
                    <i className="fas fa-sync-alt mr-2"></i>
                    {isFetchingUpdates ? 'Fetching...' : 'Fetch Now'}
                  </Button>
                </div>
              )}
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
