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
  type: 'flower' | 'tree' | 'bench' | 'fountain';
  emoji: string;
  planted?: boolean;
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
  const [selectedAction, setSelectedAction] = useState<'move' | 'plant'>('move');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

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

  const plantFlower = () => {
    if (!connected) return;
    
    // Check if there's already something at this position
    const existingItem = [...staticGardenItems, ...plantedFlowers].find(
      item => item.x === position.x && item.y === position.y
    );
    
    if (!existingItem) {
      const flowers = ['🌸', '🌺', '🌻', '🌷', '🌹'];
      const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
      
      const newFlower: GardenItem = {
        x: position.x,
        y: position.y,
        type: 'flower',
        emoji: randomFlower,
        planted: true
      };
      
      setPlantedFlowers(prev => [...prev, newFlower]);
      sendGardenUpdate(position, `planted ${randomFlower}`);
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
          cellContent = item.emoji;
          cellBg = item.planted ? 'bg-pink-100' : 'bg-green-200';
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
            onClick={() => selectedAction === 'move' && move('north')} // This could be improved with proper click-to-move
            title={`(${x}, ${y})${item ? ` - ${item.type}` : ''}${isPlayerPosition ? ' - You are here' : ''}${otherPlayer ? ' - Other player' : ''}`}
          >
            {cellContent}
          </div>
        );
      }
    }
    
    return grid;
  };

  const getPositionDescription = () => {
    const item = [...staticGardenItems, ...plantedFlowers].find(
      item => item.x === position.x && item.y === position.y
    );
    
    if (item) {
      return `You're standing near a ${item.type} ${item.emoji}. ${item.planted ? 'You planted this!' : 'What a lovely sight!'}`;
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
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={plantFlower}
                      className="bg-pink-500 hover:bg-pink-600"
                    >
                      🌸 Plant Flower
                    </Button>
                  </div>
                </div>
                
                {/* Info */}
                <div className="space-y-1 text-xs text-gray-600">
                  <p>Position: ({position.x}, {position.y})</p>
                  <p>Flowers planted: {plantedFlowers.length}</p>
                  <p>Other explorers: {Object.keys(otherPlayers).length}</p>
                </div>
              </div>
              
              <div className="text-center text-xs text-gray-500">
                🌞 Walk together with Milla through this digital space - every step is shared! 🌞
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}