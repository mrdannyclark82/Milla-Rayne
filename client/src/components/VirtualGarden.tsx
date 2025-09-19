import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VirtualGardenProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface GardenItem {
  x: number;
  y: number;
  type: 'flower' | 'tree' | 'bench' | 'fountain' | 'vegetable' | 'herb' | 'fruit';
  emoji: string;
  planted?: boolean;
  plantedAt?: number;
  lastTended?: number;
  health?: number; // 0-100, affects appearance and growth
  growthStage?: number; // 0-3 for different growth stages
}

// Garden size (grid-based)
const GARDEN_SIZE = 10;

// Pre-placed garden items
const staticGardenItems: GardenItem[] = [
  { x: 2, y: 3, type: 'tree', emoji: '🌳' },
  { x: 7, y: 2, type: 'fountain', emoji: '⛲' },
  { x: 4, y: 6, type: 'bench', emoji: '🪑' },
  { x: 1, y: 8, type: 'flower', emoji: '🌸' },
  { x: 8, y: 7, type: 'flower', emoji: '🌺' },
  { x: 5, y: 1, type: 'tree', emoji: '🌲' },
];

export default function VirtualGarden({ isOpen, onClose }: VirtualGardenProps) {
  const [position, setPosition] = useState<Position>({ x: 5, y: 5 });
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [otherPlayers, setOtherPlayers] = useState<{ [key: string]: Position }>({});
  const [plantedFlowers, setPlantedFlowers] = useState<GardenItem[]>([]);
  const [selectedAction, setSelectedAction] = useState<'move' | 'plant' | 'tend'>('move');
  const [selectedPlantType, setSelectedPlantType] = useState<'flower' | 'vegetable' | 'herb' | 'fruit' | 'tree'>('flower');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastTendingTime, setLastTendingTime] = useState<number>(Date.now());
  const [showOverview, setShowOverview] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Plant growth and health system
  useEffect(() => {
    const interval = setInterval(() => {
      setPlantedFlowers(prev => prev.map(plant => {
        if (!plant.planted) return plant;
        
        const now = Date.now();
        const timeSinceLastTended = now - (plant.lastTended || plant.plantedAt || now);
        const daysSinceLastTended = timeSinceLastTended / (1000 * 60 * 60 * 24);
        
        let newHealth = plant.health || 100;
        let newGrowthStage = plant.growthStage || 0;
        
        // Health decreases over time without tending
        if (daysSinceLastTended > 1) {
          newHealth = Math.max(0, newHealth - (daysSinceLastTended - 1) * 10);
        }
        
        // Growth progresses with good health and tending
        const timeSincePlanted = now - (plant.plantedAt || now);
        const daysGrowing = timeSincePlanted / (1000 * 60 * 60 * 24);
        
        if (newHealth > 70 && daysGrowing > 0.5) {
          newGrowthStage = Math.min(3, Math.floor(daysGrowing * 2));
        }
        
        return {
          ...plant,
          health: newHealth,
          growthStage: newGrowthStage
        };
      }));
    }, 30000); // Update every 30 seconds for demo purposes
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen && !connected) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnectionStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Connected to garden server');
      setConnected(true);
      setConnectionStatus('connected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = () => {
      console.log('Disconnected from garden server');
      setConnected(false);
      setConnectionStatus('disconnected');
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'connected':
        setPlayerId(data.playerId);
        break;
      case 'garden_update':
        if (data.playerId !== playerId) {
          setOtherPlayers(prev => ({
            ...prev,
            [data.playerId]: data.position
          }));
        }
        break;
      case 'error':
        console.error('Garden error:', data.message);
        break;
    }
  };

  const move = (direction: 'north' | 'south' | 'east' | 'west') => {
    if (!connected) return;

    const newPosition = { ...position };
    
    switch (direction) {
      case 'north':
        if (newPosition.y > 0) newPosition.y--;
        break;
      case 'south':
        if (newPosition.y < GARDEN_SIZE - 1) newPosition.y++;
        break;
      case 'east':
        if (newPosition.x < GARDEN_SIZE - 1) newPosition.x++;
        break;
      case 'west':
        if (newPosition.x > 0) newPosition.x--;
        break;
    }
    
    if (newPosition.x !== position.x || newPosition.y !== position.y) {
      setPosition(newPosition);
      sendGardenUpdate(newPosition, `moved ${direction}`);
    }
  };

  const getPlantOptions = (type: typeof selectedPlantType) => {
    switch (type) {
      case 'flower':
        return ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌵', '🌿'];
      case 'vegetable':
        return ['🥕', '🥬', '🥒', '🍅', '🌶️', '🥦', '🌽', '🥔'];
      case 'herb':
        return ['🌱', '🍃', '🌿', '☘️', '🪴'];
      case 'fruit':
        return ['🍓', '🍇', '🫐', '🍊', '🍎', '🍌'];
      case 'tree':
        return ['🌳', '🌲', '🌴', '🫒', '🌰'];
      default:
        return ['🌸'];
    }
  };

  const plantFlower = () => {
    if (!connected) return;
    
    // Check if there's already something at this position
    const existingItem = [...staticGardenItems, ...plantedFlowers].find(
      item => item.x === position.x && item.y === position.y
    );
    
    if (!existingItem) {
      const plantOptions = getPlantOptions(selectedPlantType);
      const randomPlant = plantOptions[Math.floor(Math.random() * plantOptions.length)];
      
      const newPlant: GardenItem = {
        x: position.x,
        y: position.y,
        type: selectedPlantType,
        emoji: randomPlant,
        planted: true,
        plantedAt: Date.now(),
        lastTended: Date.now(),
        health: 100,
        growthStage: 0
      };
      
      setPlantedFlowers(prev => [...prev, newPlant]);
      sendGardenUpdate(position, `planted ${randomPlant}`);
    }
  };

  const tendPlant = () => {
    if (!connected) return;
    
    const plantIndex = plantedFlowers.findIndex(
      item => item.x === position.x && item.y === position.y && item.planted
    );
    
    if (plantIndex >= 0) {
      setPlantedFlowers(prev => prev.map((plant, index) => {
        if (index === plantIndex) {
          const newHealth = Math.min(100, (plant.health || 0) + 20);
          return {
            ...plant,
            lastTended: Date.now(),
            health: newHealth
          };
        }
        return plant;
      }));
      
      setLastTendingTime(Date.now());
      sendGardenUpdate(position, `tended plant`);
    }
  };

  const sendGardenUpdate = (pos: Position, action: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const updateData = {
      type: 'garden_move',
      playerId,
      position: pos,
      action,
      timestamp: Date.now()
    };

    wsRef.current.send(JSON.stringify(updateData));
  };

  const getPlantDisplay = (plant: GardenItem): string => {
    if (!plant.planted) return plant.emoji;
    
    const health = plant.health || 100;
    const growthStage = plant.growthStage || 0;
    
    // Show different versions based on health and growth
    if (health < 25) {
      return '🥀'; // Wilted
    } else if (health < 50) {
      return plant.emoji + '💧'; // Needs water
    } else if (growthStage >= 3) {
      return plant.emoji + '✨'; // Fully grown
    } else if (growthStage >= 2) {
      return plant.emoji + '🌟'; // Growing well
    }
    
    return plant.emoji;
  };

  const renderGarden = () => {
    const grid = [];
    
    for (let y = 0; y < GARDEN_SIZE; y++) {
      for (let x = 0; x < GARDEN_SIZE; x++) {
        const isPlayerPosition = position.x === x && position.y === y;
        const otherPlayer = Object.entries(otherPlayers).find(
          ([id, pos]) => pos.x === x && pos.y === y
        );
        
        // Find items at this position
        const staticItem = staticGardenItems.find(item => item.x === x && item.y === y);
        const plantedItem = plantedFlowers.find(item => item.x === x && item.y === y);
        const item = plantedItem || staticItem;
        
        let cellContent = '';
        let cellBg = 'bg-green-100';
        
        if (isPlayerPosition) {
          cellContent = '🧑‍🌾'; // You
          cellBg = 'bg-blue-200';
        } else if (otherPlayer) {
          cellContent = '👤'; // Other player
          cellBg = 'bg-purple-200';
        } else if (item) {
          cellContent = getPlantDisplay(item);
          if (item.planted) {
            const health = item.health || 100;
            cellBg = health < 25 ? 'bg-red-100' : 
                     health < 50 ? 'bg-yellow-100' : 
                     health < 75 ? 'bg-green-100' : 'bg-green-200';
          } else {
            cellBg = 'bg-green-200';
          }
        }
        
        grid.push(
          <div
            key={`${x}-${y}`}
            className={`
              w-12 h-12 border border-green-300 flex items-center justify-center
              text-2xl cursor-pointer transition-all duration-200
              ${cellBg} hover:bg-opacity-80
              ${isPlayerPosition ? 'ring-2 ring-blue-500' : ''}
            `}
            onClick={() => {
              if (selectedAction === 'move') {
                // Simple click-to-move (could be improved with pathfinding)
                setPosition({ x, y });
                sendGardenUpdate({ x, y }, 'moved to position');
              }
            }}
            title={`(${x}, ${y})${item ? ` - ${item.type}` : ''}${item?.planted ? ` - Health: ${item.health || 100}%` : ''}${isPlayerPosition ? ' - You are here' : ''}${otherPlayer ? ' - Other player' : ''}`}
          >
            {cellContent}
          </div>
        );
      }
    }
    
    return grid;
  };

  const renderOverview = () => {
    const healthyPlants = plantedFlowers.filter(p => (p.health || 0) > 70).length;
    const strugglingPlants = plantedFlowers.filter(p => (p.health || 0) < 50).length;
    const totalPlants = plantedFlowers.length;
    
    const plantTypes = plantedFlowers.reduce((acc, plant) => {
      acc[plant.type] = (acc[plant.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create bird's eye view mini-map
    const renderBirdsEyeMap = () => {
      const mapGrid = [];
      
      for (let y = 0; y < GARDEN_SIZE; y++) {
        for (let x = 0; x < GARDEN_SIZE; x++) {
          const isPlayerPosition = position.x === x && position.y === y;
          const otherPlayer = Object.entries(otherPlayers).find(
            ([id, pos]) => pos.x === x && pos.y === y
          );
          
          // Find items at this position
          const staticItem = staticGardenItems.find(item => item.x === x && item.y === y);
          const plantedItem = plantedFlowers.find(item => item.x === x && item.y === y);
          const item = plantedItem || staticItem;
          
          let cellContent = '';
          let cellBg = 'bg-green-50'; // Empty soil
          let cellBorder = 'border-green-200';
          
          if (isPlayerPosition) {
            cellContent = '👤';
            cellBg = 'bg-blue-100';
            cellBorder = 'border-blue-400';
          } else if (otherPlayer) {
            cellContent = '👥';
            cellBg = 'bg-purple-100';
            cellBorder = 'border-purple-400';
          } else if (item) {
            if (item.planted) {
              const health = item.health || 100;
              cellContent = getPlantDisplay(item);
              cellBg = health < 25 ? 'bg-red-100' : 
                       health < 50 ? 'bg-yellow-100' : 
                       health < 75 ? 'bg-green-100' : 'bg-green-200';
              cellBorder = 'border-green-400';
            } else {
              cellContent = item.emoji;
              cellBg = 'bg-amber-100';
              cellBorder = 'border-amber-400';
            }
          }
          
          mapGrid.push(
            <div
              key={`map-${x}-${y}`}
              className={`
                w-6 h-6 border flex items-center justify-center
                text-xs transition-all duration-200
                ${cellBg} ${cellBorder}
                ${isPlayerPosition ? 'ring-1 ring-blue-500' : ''}
              `}
              title={`(${x}, ${y})${item ? ` - ${item.type}` : ' - Empty'}${item?.planted ? ` - Health: ${item.health || 100}%` : ''}${isPlayerPosition ? ' - You are here' : ''}${otherPlayer ? ' - Other player' : ''}`}
            >
              {cellContent}
            </div>
          );
        }
      }
      
      return mapGrid;
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🌱 Garden Overview</h3>
        
        {/* Bird's Eye View Map */}
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <h4 className="font-medium text-green-800 mb-3 text-center">🦅 Bird's Eye View</h4>
          <div className="flex justify-center">
            <div className="grid grid-cols-10 gap-0 border-2 border-green-600 inline-block">
              {renderBirdsEyeMap()}
            </div>
          </div>
          <div className="mt-3 text-xs text-center text-green-700">
            <div className="flex justify-center space-x-4 flex-wrap">
              <span>🟢 Empty Soil</span>
              <span>🌱 Planted</span>
              <span>🏛️ Structures</span>
              <span>👤 Your Position</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800">Garden Health</h4>
            <div className="text-sm space-y-1">
              <p>✅ Healthy plants: {healthyPlants}</p>
              <p>⚠️ Struggling plants: {strugglingPlants}</p>
              <p>📊 Total plants: {totalPlants}</p>
              <p>🌍 Empty spaces: {(GARDEN_SIZE * GARDEN_SIZE) - totalPlants - staticGardenItems.length}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800">Plant Varieties</h4>
            <div className="text-sm space-y-1">
              {Object.entries(plantTypes).map(([type, count]) => (
                <p key={type}>
                  {type === 'flower' ? '🌸' : 
                   type === 'vegetable' ? '🥕' : 
                   type === 'herb' ? '🌿' : 
                   type === 'fruit' ? '🍓' : '🌳'} {type}: {count}
                </p>
              ))}
              {Object.keys(plantTypes).length === 0 && (
                <p className="text-gray-500 italic">No plants yet - start gardening!</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 p-3 rounded-lg">
          <h4 className="font-medium text-amber-800">Tending Tips</h4>
          <div className="text-sm space-y-1">
            <p>💧 Plants need tending every day to stay healthy</p>
            <p>🌱 Healthy plants grow through 4 stages over time</p>
            <p>⚠️ Neglected plants will wilt and may die</p>
            <p>✨ Well-tended plants produce beautiful blooms!</p>
          </div>
        </div>
      </div>
    );
  };

  const getPositionDescription = () => {
    const item = [...staticGardenItems, ...plantedFlowers].find(
      item => item.x === position.x && item.y === position.y
    );
    
    if (item) {
      const healthText = item.health ? 
        item.health > 70 ? 'thriving!' : 
        item.health > 50 ? 'doing okay.' : 
        item.health > 25 ? 'struggling and needs care.' : 'wilting badly!' : '';
      
      return `You're standing near a ${item.type} ${item.emoji}. ${
        item.planted ? `You planted this - it's ${healthText}` : 'What a lovely sight!'
      }`;
    }
    
    return `You're in an open area of the garden at (${position.x}, ${position.y}). The grass feels soft under your feet.`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">🌱 Virtual Garden</CardTitle>
            <p className="text-gray-600 mt-1">Explore our digital garden together</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
              className={connectionStatus === 'connected' ? 'bg-green-500' : ''}
            >
              {connectionStatus === 'connected' ? '🟢 Connected' : 
               connectionStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {connectionStatus !== 'connected' && (
            <div className="text-center py-4">
              <Button onClick={connectWebSocket} disabled={connectionStatus === 'connecting'}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Enter Garden'}
              </Button>
            </div>
          )}
          
          {connected && (
            <>
              {/* Tab Navigation */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={!showOverview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOverview(false)}
                >
                  🌱 Garden View
                </Button>
                <Button
                  variant={showOverview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOverview(true)}
                >
                  📊 Overview
                </Button>
              </div>

              {!showOverview ? (
                <>
                  {/* Garden Grid */}
                  <div className="flex justify-center">
                    <div className="grid grid-cols-10 gap-0 border-2 border-green-600 inline-block">
                      {renderGarden()}
                    </div>
                  </div>
                  
                  {/* Position Description */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">{getPositionDescription()}</p>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex flex-col gap-4">
                    {/* Action Selection */}
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">Action Mode:</p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={selectedAction === 'move' ? 'default' : 'outline'}
                          onClick={() => setSelectedAction('move')}
                        >
                          🚶 Move
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedAction === 'plant' ? 'default' : 'outline'}
                          onClick={() => setSelectedAction('plant')}
                        >
                          🌱 Plant
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedAction === 'tend' ? 'default' : 'outline'}
                          onClick={() => setSelectedAction('tend')}
                        >
                          💧 Tend
                        </Button>
                      </div>
                    </div>

                    {/* Plant Type Selection (when planting) */}
                    {selectedAction === 'plant' && (
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Plant Type:</p>
                        <div className="flex gap-2 flex-wrap">
                          {(['flower', 'vegetable', 'herb', 'fruit', 'tree'] as const).map((type) => (
                            <Button
                              key={type}
                              size="sm"
                              variant={selectedPlantType === type ? 'default' : 'outline'}
                              onClick={() => setSelectedPlantType(type)}
                            >
                              {type === 'flower' ? '🌸' : 
                               type === 'vegetable' ? '🥕' : 
                               type === 'herb' ? '🌿' : 
                               type === 'fruit' ? '🍓' : '🌳'} {type}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      {/* Movement Controls */}
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Movement:</p>
                        <div className="grid grid-cols-3 gap-1 w-fit">
                          <div></div>
                          <Button size="sm" onClick={() => move('north')} disabled={position.y === 0}>↑</Button>
                          <div></div>
                          <Button size="sm" onClick={() => move('west')} disabled={position.x === 0}>←</Button>
                          <div className="flex items-center justify-center text-xs">🧑‍🌾</div>
                          <Button size="sm" onClick={() => move('east')} disabled={position.x === GARDEN_SIZE - 1}>→</Button>
                          <div></div>
                          <Button size="sm" onClick={() => move('south')} disabled={position.y === GARDEN_SIZE - 1}>↓</Button>
                          <div></div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Actions:</p>
                        <div className="flex gap-2 flex-col">
                          <Button 
                            size="sm" 
                            onClick={plantFlower}
                            className="bg-pink-500 hover:bg-pink-600"
                            disabled={selectedAction !== 'plant'}
                          >
                            🌱 Plant {selectedPlantType}
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={tendPlant}
                            className="bg-blue-500 hover:bg-blue-600"
                            disabled={selectedAction !== 'tend'}
                          >
                            💧 Tend Plant
                          </Button>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>Position: ({position.x}, {position.y})</p>
                        <p>Plants: {plantedFlowers.length}</p>
                        <p>Healthy: {plantedFlowers.filter(p => (p.health || 0) > 70).length}</p>
                        <p>Other explorers: {Object.keys(otherPlayers).length}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                renderOverview()
              )}
              
              <div className="text-center text-xs text-gray-500">
                🌞 Nurture your garden together with Milla - every plant tells our story! 🌞
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}