import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RealTimeGamingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GameMove {
  from: string;
  to: string;
  piece: string;
  playerId: string;
  timestamp: number;
}

interface GameState {
  moves: GameMove[];
  currentPlayer: string;
}

// Simple chess-like board representation (8x8)
const initialBoard = () => {
  const board: { [key: string]: string } = {};
  // Simple pieces setup for demo
  for (let i = 0; i < 8; i++) {
    board[`${String.fromCharCode(97 + i)}2`] = '♟'; // Black pawns
    board[`${String.fromCharCode(97 + i)}7`] = '♙'; // White pawns
  }
  
  // Add some pieces for demonstration
  board['a1'] = '♜'; board['h1'] = '♜'; // Black rooks
  board['b1'] = '♞'; board['g1'] = '♞'; // Black knights
  board['c1'] = '♝'; board['f1'] = '♝'; // Black bishops
  board['d1'] = '♛'; board['e1'] = '♚'; // Black queen and king
  
  board['a8'] = '♖'; board['h8'] = '♖'; // White rooks
  board['b8'] = '♘'; board['g8'] = '♘'; // White knights
  board['c8'] = '♗'; board['f8'] = '♗'; // White bishops
  board['d8'] = '♕'; board['e8'] = '♔'; // White queen and king
  
  return board;
};

export default function RealTimeGaming({ isOpen, onClose }: RealTimeGamingProps) {
  const [connected, setConnected] = useState(false);
  const [gameBoard, setGameBoard] = useState(initialBoard());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [gameId] = useState(`game_${Date.now()}`);
  const [playerId, setPlayerId] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>({ moves: [], currentPlayer: '' });
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
      console.log('Connected to game server');
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
      console.log('Disconnected from game server');
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
      case 'game_update':
        if (data.gameId === gameId) {
          updateGameBoard(data.move);
          setGameState(data.gameState);
        }
        break;
      case 'error':
        console.error('Game error:', data.message);
        break;
    }
  };

  const updateGameBoard = (move: { from: string; to: string; piece: string }) => {
    setGameBoard(prev => {
      const newBoard = { ...prev };
      // Move piece from source to destination
      if (newBoard[move.from]) {
        newBoard[move.to] = newBoard[move.from];
        delete newBoard[move.from];
      }
      return newBoard;
    });
  };

  const handleSquareClick = (square: string) => {
    if (!connected) return;

    if (selectedSquare) {
      // Make a move
      const piece = gameBoard[selectedSquare];
      if (piece) {
        sendMove(selectedSquare, square, piece);
      }
      setSelectedSquare(null);
    } else {
      // Select a square
      if (gameBoard[square]) {
        setSelectedSquare(square);
      }
    }
  };

  const sendMove = (from: string, to: string, piece: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const moveData = {
      type: 'move',
      gameId,
      playerId,
      move: { from, to, piece },
      timestamp: Date.now()
    };

    wsRef.current.send(JSON.stringify(moveData));
  };

  const renderBoard = () => {
    const squares = [];
    for (let row = 8; row >= 1; row--) {
      for (let col = 0; col < 8; col++) {
        const square = `${String.fromCharCode(97 + col)}${row}`;
        const isLight = (row + col) % 2 === 0;
        const piece = gameBoard[square];
        const isSelected = selectedSquare === square;
        
        squares.push(
          <div
            key={square}
            className={`
              w-12 h-12 flex items-center justify-center cursor-pointer text-2xl
              ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
              ${isSelected ? 'ring-4 ring-blue-500' : ''}
              hover:bg-opacity-80 transition-all duration-200
            `}
            onClick={() => handleSquareClick(square)}
          >
            {piece}
          </div>
        );
      }
    }
    return squares;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">🎮 Real-Time Gaming</CardTitle>
            <p className="text-gray-600 mt-1">Play chess with Milla in real-time</p>
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
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to Game'}
              </Button>
            </div>
          )}
          
          {connected && (
            <>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Player ID: {playerId}</span>
                <span>Moves: {gameState.moves.length}</span>
              </div>
              
              <div className="flex justify-center">
                <div className="grid grid-cols-8 gap-0 border-2 border-gray-800 inline-block">
                  {renderBoard()}
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  {selectedSquare ? `Selected: ${selectedSquare}` : 'Click a piece to select it, then click where to move'}
                </p>
                <p className="text-xs text-gray-500">
                  Every move you make is instantly reflected for Milla! ✨
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}