import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface SmartWatchProps {
  className?: string;
}

interface WatchFeature {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'active' | 'processing' | 'completed' | 'idle';
  action: () => void;
}

export default function SmartWatch({ className = "" }: SmartWatchProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDimmed, setIsDimmed] = useState(false);
  const [coffeeStatus, setCoffeeStatus] = useState<'idle' | 'brewing' | 'ready'>('idle');
  const [codingHelp, setCodingHelp] = useState<'idle' | 'analyzing' | 'solved'>('idle');
  const [dinnerStatus, setDinnerStatus] = useState<'idle' | 'searching' | 'reserved'>('idle');
  const [isWatchDialogOpen, setIsWatchDialogOpen] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Apply screen dimming effect
  useEffect(() => {
    if (isDimmed) {
      document.body.style.filter = 'brightness(0.4)';
      document.body.style.transition = 'filter 0.3s ease';
    } else {
      document.body.style.filter = 'brightness(1)';
    }

    return () => {
      document.body.style.filter = 'brightness(1)';
    };
  }, [isDimmed]);

  const handleCoffeeBrewing = () => {
    setCoffeeStatus('brewing');
    setTimeout(() => {
      setCoffeeStatus('ready');
      setTimeout(() => setCoffeeStatus('idle'), 3000);
    }, 2000);
  };

  const handleCodingHelp = () => {
    setCodingHelp('analyzing');
    setTimeout(() => {
      setCodingHelp('solved');
      setTimeout(() => setCodingHelp('idle'), 3000);
    }, 1500);
  };

  const handleDinnerReservation = () => {
    setDinnerStatus('searching');
    setTimeout(() => {
      setDinnerStatus('reserved');
      setTimeout(() => setDinnerStatus('idle'), 3000);
    }, 2500);
  };

  const handleYouTubePlaylist = () => {
    window.open('https://www.youtube.com/playlist?list=PLnaOaPuWUJKVeL_BF2twDZkgWYEtuMBsG', '_blank');
  };

  const handleScreenDim = () => {
    setIsDimmed(!isDimmed);
  };

  const watchFeatures: WatchFeature[] = [
    {
      id: 'coffee',
      name: 'Coffee Brewing',
      icon: '☕',
      description: 'Milla brews her perfect cup',
      status: coffeeStatus === 'idle' ? 'idle' : coffeeStatus === 'brewing' ? 'processing' : 'completed',
      action: handleCoffeeBrewing
    },
    {
      id: 'coding',
      name: 'Code Analysis',
      icon: '💻',
      description: 'Milla analyzes coding problems',
      status: codingHelp === 'idle' ? 'idle' : codingHelp === 'analyzing' ? 'processing' : 'completed',
      action: handleCodingHelp
    },
    {
      id: 'dinner',
      name: 'Dinner Planning',
      icon: '🍽️',
      description: 'Milla plans romantic dinners',
      status: dinnerStatus === 'idle' ? 'idle' : dinnerStatus === 'searching' ? 'processing' : 'completed',
      action: handleDinnerReservation
    },
    {
      id: 'youtube',
      name: 'Music Access',
      icon: '🎵',
      description: 'Milla opens her playlist',
      status: 'active',
      action: handleYouTubePlaylist
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500 animate-pulse';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (feature: WatchFeature) => {
    switch (feature.id) {
      case 'coffee':
        return coffeeStatus === 'brewing' ? 'Brewing...' : coffeeStatus === 'ready' ? 'Ready!' : 'Idle';
      case 'coding':
        return codingHelp === 'analyzing' ? 'Analyzing...' : codingHelp === 'solved' ? 'Complete!' : 'Ready';
      case 'dinner':
        return dinnerStatus === 'searching' ? 'Planning...' : dinnerStatus === 'reserved' ? 'Planned!' : 'Available';
      default:
        return 'Ready';
    }
  };

  return (
    <div className={className}>
      <Dialog open={isWatchDialogOpen} onOpenChange={setIsWatchDialogOpen}>
        <DialogTrigger asChild>
          <Card className="w-64 h-64 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600 cursor-pointer hover:scale-105 transition-transform duration-200 p-4 relative overflow-hidden">
            {/* Watch Face Background */}
            <div className="absolute inset-2 rounded-full bg-black border-4 border-gray-600 shadow-inner">
              {/* Digital Display */}
              <div className="h-full flex flex-col items-center justify-center text-center">
                {/* Time Display */}
                <div className="text-green-400 font-mono text-lg mb-2">
                  {currentTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
                
                {/* Date Display */}
                <div className="text-green-300 font-mono text-sm mb-3">
                  {currentTime.toLocaleDateString([], {
                    month: 'short',
                    day: '2-digit'
                  })}
                </div>

                {/* Status Indicators */}
                <div className="flex space-x-1 mb-2">
                  {watchFeatures.slice(0, 3).map((feature) => (
                    <div key={feature.id} className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(feature.status)}`}></div>
                      <div className="text-xs text-gray-400 mt-1">{feature.icon}</div>
                    </div>
                  ))}
                </div>

                {/* Title */}
                <div className="text-purple-400 text-xs font-semibold">
                  MILLA WATCH
                </div>
              </div>
            </div>

            {/* Watch Crown */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-6 bg-gray-600 rounded-l-lg"></div>
            
            {/* Watch Band */}
            <div className="absolute -left-4 top-4 bottom-4 w-6 bg-gray-700 rounded-l-full"></div>
            <div className="absolute -right-4 top-4 bottom-4 w-6 bg-gray-700 rounded-r-full"></div>
          </Card>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-2xl">⌚</span>
              <span>Milla's Personal Smart Watch</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Watch Overview */}
            <Card className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  This is Milla's personal multi-purpose smart watch. She uses it to manage her daily tasks and assist you better.
                </p>
              </div>
            </Card>

            {/* Current Time & Status */}
            <Card className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-mono">
                    {currentTime.toLocaleTimeString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentTime.toDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Milla's Screen Dim</span>
                  <Switch checked={isDimmed} onCheckedChange={handleScreenDim} />
                </div>
              </div>
            </Card>

            {/* Milla's Watch Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {watchFeatures.map((feature) => (
                <Card key={feature.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-2xl">{feature.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{feature.name}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(feature.status)}`}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(feature)}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={feature.action}
                      disabled={feature.status === 'processing'}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {feature.status === 'processing' ? 'In Progress...' : 'View'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Future Watch Enhancements */}
            <Card className="p-4 border-dashed border-2 border-muted-foreground/30">
              <div className="text-center space-y-3">
                <div className="text-4xl opacity-50">🚀</div>
                <h3 className="font-semibold text-muted-foreground">Future Watch Features</h3>
                <p className="text-sm text-muted-foreground">
                  Milla's watch is continuously evolving. These upcoming features will help her assist you even better.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <Badge variant="secondary">Weather Alerts</Badge>
                  <Badge variant="secondary">Health Monitor</Badge>
                  <Badge variant="secondary">Smart Home</Badge>
                  <Badge variant="secondary">Advanced AI</Badge>
                </div>
              </div>
            </Card>

            {/* Milla's Usage Stats */}
            <Card className="p-4 bg-muted/30">
              <h3 className="font-semibold mb-3 flex items-center space-x-2">
                <span>📊</span>
                <span>Milla's Watch Statistics</span>
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-500">47</div>
                  <div className="text-xs text-muted-foreground">Coffee Cups Brewed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">23</div>
                  <div className="text-xs text-muted-foreground">Code Issues Analyzed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-pink-500">12</div>
                  <div className="text-xs text-muted-foreground">Dinners Planned</div>
                </div>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}