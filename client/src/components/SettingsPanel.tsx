import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface SettingsPanelProps {
  children?: React.ReactNode;
  voiceEnabled?: boolean;
  onVoiceToggle?: (enabled: boolean) => void;
  speechRate?: number;
  onSpeechRateChange?: (rate: number) => void;
}

export default function SettingsPanel({ 
  children, 
  voiceEnabled = false, 
  onVoiceToggle,
  speechRate = 1.0,
  onSpeechRateChange 
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleVoiceToggle = () => {
    onVoiceToggle?.(!voiceEnabled);
  };

  const handleSpeechRateChange = () => {
    const newRate = speechRate >= 1.5 ? 0.75 : speechRate + 0.25;
    onSpeechRateChange?.(newRate);
  };

  const getSpeechRateLabel = () => {
    if (speechRate <= 0.75) return "Slow";
    if (speechRate >= 1.5) return "Fast";
    return "Normal";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-black/80 backdrop-blur-md border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* Appearance Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-palette mr-2 text-purple-400"></i>
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Theme</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                    <i className="fas fa-sun mr-1"></i>
                    Light
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white bg-white/20">
                    <i className="fas fa-moon mr-1"></i>
                    Dark
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Background Blur</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-sliders-h mr-1"></i>
                  Adjust
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Chat Transparency</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-adjust mr-1"></i>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wardrobe Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-tshirt mr-2 text-pink-400"></i>
                Wardrobe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Outfit Style</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-user-tie mr-1"></i>
                  Professional
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Color Scheme</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-palette mr-1"></i>
                  Customize
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Accessories</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-glasses mr-1"></i>
                  None
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personality Tuning Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-brain mr-2 text-blue-400"></i>
                Personality Tuning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Communication Style</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-comments mr-1"></i>
                  Adaptive
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Formality Level</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-balance-scale mr-1"></i>
                  Balanced
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Response Length</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-text-width mr-1"></i>
                  Medium
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Emotional Intelligence</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-heart mr-1"></i>
                  High
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Voice Settings Section */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <i className="fas fa-volume-up mr-2 text-green-400"></i>
                Voice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Voice Responses</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`border-white/30 text-white/70 hover:text-white ${voiceEnabled ? 'bg-green-600/20 border-green-400/50 text-green-300' : ''}`}
                  onClick={handleVoiceToggle}
                  data-testid="button-voice-toggle"
                >
                  <i className={`fas ${voiceEnabled ? 'fa-toggle-on' : 'fa-toggle-off'} mr-1`}></i>
                  {voiceEnabled ? 'On' : 'Off'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Voice Input</span>
                <Button variant="outline" size="sm" className="border-white/30 text-white/70 hover:text-white">
                  <i className="fas fa-microphone mr-1"></i>
                  Available
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">Speech Rate</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/30 text-white/70 hover:text-white"
                  onClick={handleSpeechRateChange}
                  data-testid="button-speech-rate"
                >
                  <i className="fas fa-tachometer-alt mr-1"></i>
                  {getSpeechRateLabel()}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="bg-white/20" />

        {/* Footer */}
        <div className="flex justify-between items-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="border-white/30 text-white/70 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => setIsOpen(false)}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}