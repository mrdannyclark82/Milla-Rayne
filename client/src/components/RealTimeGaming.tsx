import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
}

interface ChatMessage {
  id: string;
  playerId: string;
  message: string;
  timestamp: number;
  type: 'chat' | 'hint' | 'system';
}

interface MoveHint {
  from: string;
  to: string;
  piece: string;
  description: string;
  quality: 'good' | 'better' | 'best' | 'blunder';
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
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [gameId] = useState(`game_${Date.now()}`);
  const [playerId, setPlayerId] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>({ 
    moves: [], 
    currentPlayer: 'white',
    isCheck: false,
    isCheckmate: false,
    isStalemate: false
  });
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showHints, setShowHints] = useState(true);
  const [currentHints, setCurrentHints] = useState<MoveHint[]>([]);
  const [showChat, setShowChat] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Chess move validation logic
  const isValidMove = (from: string, to: string, piece: string): boolean => {
    const fromCol = from.charCodeAt(0) - 97;
    const fromRow = parseInt(from[1]) - 1;
    const toCol = to.charCodeAt(0) - 97;
    const toRow = parseInt(to[1]) - 1;
    
    const deltaCol = Math.abs(toCol - fromCol);
    const deltaRow = Math.abs(toRow - fromRow);
    
    // Basic piece movement validation
    const pieceType = piece.toLowerCase();
    switch (pieceType) {
      case '♙': case '♟': // Pawns
        const direction = piece === '♙' ? 1 : -1;
        const startRow = piece === '♙' ? 1 : 6;
        if (fromCol === toCol) {
          // Forward move
          if (toRow === fromRow + direction) return !gameBoard[to];
          if (fromRow === startRow && toRow === fromRow + 2 * direction) return !gameBoard[to];
        } else if (deltaCol === 1 && toRow === fromRow + direction) {
          // Capture
          return !!gameBoard[to] && isOpponentPiece(piece, gameBoard[to]);
        }
        return false;
        
      case '♖': case '♜': // Rooks
        return (fromCol === toCol || fromRow === toRow) && isPathClear(from, to);
        
      case '♗': case '♝': // Bishops
        return deltaCol === deltaRow && isPathClear(from, to);
        
      case '♕': case '♛': // Queens
        return ((fromCol === toCol || fromRow === toRow) || deltaCol === deltaRow) && isPathClear(from, to);
        
      case '♔': case '♚': // Kings
        return deltaCol <= 1 && deltaRow <= 1;
        
      case '♘': case '♞': // Knights
        return (deltaCol === 2 && deltaRow === 1) || (deltaCol === 1 && deltaRow === 2);
        
      default:
        return false;
    }
  };

  const isOpponentPiece = (piece1: string, piece2: string): boolean => {
    const whitePieces = '♔♕♖♗♘♙';
    const blackPieces = '♚♛♜♝♞♟';
    return (whitePieces.includes(piece1) && blackPieces.includes(piece2)) ||
           (blackPieces.includes(piece1) && whitePieces.includes(piece2));
  };

  const isPathClear = (from: string, to: string): boolean => {
    const fromCol = from.charCodeAt(0) - 97;
    const fromRow = parseInt(from[1]) - 1;
    const toCol = to.charCodeAt(0) - 97;
    const toRow = parseInt(to[1]) - 1;
    
    const deltaCol = toCol - fromCol;
    const deltaRow = toRow - fromRow;
    const steps = Math.max(Math.abs(deltaCol), Math.abs(deltaRow));
    
    const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);
    const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
    
    for (let i = 1; i < steps; i++) {
      const checkCol = fromCol + i * stepCol;
      const checkRow = fromRow + i * stepRow;
      const checkSquare = `${String.fromCharCode(97 + checkCol)}${checkRow + 1}`;
      if (gameBoard[checkSquare]) return false;
    }
    
    return true;
  };

  const getPossibleMoves = (square: string): string[] => {
    const piece = gameBoard[square];
    if (!piece) return [];
    
    const moves: string[] = [];
    for (let row = 1; row <= 8; row++) {
      for (let col = 0; col < 8; col++) {
        const to = `${String.fromCharCode(97 + col)}${row}`;
        if (to !== square && isValidMove(square, to, piece)) {
          const targetPiece = gameBoard[to];
          if (!targetPiece || isOpponentPiece(piece, targetPiece)) {
            moves.push(to);
          }
        }
      }
    }
    return moves;
  };

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

  // Update possible moves when a square is selected
  useEffect(() => {
    if (selectedSquare) {
      const moves = getPossibleMoves(selectedSquare);
      setPossibleMoves(moves);
      
      if (showHints) {
        const hints = generateMoveHints(selectedSquare);
        setCurrentHints(hints);
      }
    } else {
      setPossibleMoves([]);
      setCurrentHints([]);
    }
  }, [selectedSquare, gameBoard, showHints]);

  const generateMoveHints = (square: string): MoveHint[] => {
    const piece = gameBoard[square];
    if (!piece) return [];
    
    const moves = getPossibleMoves(square);
    return moves.map(to => {
      const targetPiece = gameBoard[to];
      let quality: MoveHint['quality'] = 'good';
      let description = `Move ${piece} to ${to}`;
      
      if (targetPiece) {
        quality = 'better';
        description = `Capture ${targetPiece} on ${to}`;
      }
      
      // Simple evaluation for better hints
      if (to[1] === '8' || to[1] === '1') {
        if (piece === '♙' || piece === '♟') {
          quality = 'best';
          description = `Promote pawn on ${to}!`;
        }
      }
      
      return {
        from: square,
        to,
        piece,
        description,
        quality
      };
    });
  };

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
      case 'chat_message':
        if (data.gameId === gameId) {
          setChatMessages(prev => [...prev, {
            id: `${data.playerId}-${data.timestamp}`,
            playerId: data.playerId,
            message: data.message,
            timestamp: data.timestamp,
            type: 'chat'
          }]);
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
      if (piece && isValidMove(selectedSquare, square, piece)) {
        const targetPiece = gameBoard[square];
        if (!targetPiece || isOpponentPiece(piece, targetPiece)) {
          sendMove(selectedSquare, square, piece);
          
          // Add system message about the move
          const moveDescription = targetPiece 
            ? `${piece} captures ${targetPiece} on ${square}`
            : `${piece} moves to ${square}`;
          
          setChatMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            playerId: 'system',
            message: moveDescription,
            timestamp: Date.now(),
            type: 'system'
          }]);
        }
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

  const sendChatMessage = () => {
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const chatData = {
      type: 'chat',
      gameId,
      playerId,
      message: chatInput.trim(),
      timestamp: Date.now()
    };

    wsRef.current.send(JSON.stringify(chatData));
    setChatInput('');
  };

  const renderBoard = () => {
    const squares = [];
    for (let row = 8; row >= 1; row--) {
      for (let col = 0; col < 8; col++) {
        const square = `${String.fromCharCode(97 + col)}${row}`;
        const isLight = (row + col) % 2 === 0;
        const piece = gameBoard[square];
        const isSelected = selectedSquare === square;
        const isPossibleMove = possibleMoves.includes(square);
        
        squares.push(
          <div
            key={square}
            className={`
              w-12 h-12 flex items-center justify-center cursor-pointer text-2xl relative
              ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
              ${isSelected ? 'ring-4 ring-blue-500' : ''}
              ${isPossibleMove ? 'ring-2 ring-green-400' : ''}
              hover:bg-opacity-80 transition-all duration-200
            `}
            onClick={() => handleSquareClick(square)}
            title={`${square}${piece ? ` - ${piece}` : ''}${isPossibleMove ? ' - Possible move' : ''}`}
          >
            {piece}
            {isPossibleMove && !piece && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-green-400 rounded-full opacity-60"></div>
              </div>
            )}
            {isPossibleMove && piece && (
              <div className="absolute inset-0 border-2 border-red-400 rounded-full opacity-60"></div>
            )}
          </div>
        );
      }
    }
    return squares;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl bg-white/95 backdrop-blur-md max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">♟️ Chess with Milla</CardTitle>
            <p className="text-gray-600 mt-1">Strategic minds think alike</p>
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
        
        <CardContent className="space-y-4 h-[calc(90vh-120px)] flex">
          {connectionStatus !== 'connected' && (
            <div className="flex-1 flex items-center justify-center">
              <Button onClick={connectWebSocket} disabled={connectionStatus === 'connecting'}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect to Game'}
              </Button>
            </div>
          )}
          
          {connected && (
            <>
              {/* Left Panel - Game Board */}
              <div className="flex-1 space-y-4">
                {/* Game Status */}
                <div className="flex justify-between items-center text-sm">
                  <div className="space-x-4">
                    <span>Player: {playerId}</span>
                    <span>Moves: {gameState.moves.length}</span>
                    <span>Turn: {gameState.currentPlayer}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={showHints ? "default" : "outline"}
                      onClick={() => setShowHints(!showHints)}
                    >
                      💡 Hints
                    </Button>
                    <Button
                      size="sm"
                      variant={showChat ? "default" : "outline"}
                      onClick={() => setShowChat(!showChat)}
                    >
                      💬 Chat
                    </Button>
                  </div>
                </div>
                
                {/* Chess Board */}
                <div className="flex justify-center">
                  <div className="space-y-2">
                    <div className="grid grid-cols-8 gap-0 border-2 border-gray-800 inline-block">
                      {renderBoard()}
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm text-gray-600">
                        {selectedSquare ? `Selected: ${selectedSquare} (${gameBoard[selectedSquare]})` : 'Click a piece to select it'}
                      </p>
                      {possibleMoves.length > 0 && (
                        <p className="text-xs text-green-600">
                          {possibleMoves.length} possible move{possibleMoves.length !== 1 ? 's' : ''} available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Hints and Chat */}
              <div className="w-80 space-y-4">
                {showHints && (
                  <Card className="h-64">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">💡 Move Hints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        {currentHints.length > 0 ? (
                          <div className="space-y-2">
                            {currentHints.map((hint, index) => (
                              <div
                                key={index}
                                className={`p-2 rounded text-xs cursor-pointer hover:bg-gray-50 ${
                                  hint.quality === 'best' ? 'border-l-4 border-green-500 bg-green-50' :
                                  hint.quality === 'better' ? 'border-l-4 border-blue-500 bg-blue-50' :
                                  hint.quality === 'blunder' ? 'border-l-4 border-red-500 bg-red-50' :
                                  'border-l-4 border-gray-300 bg-gray-50'
                                }`}
                                onClick={() => handleSquareClick(hint.to)}
                              >
                                <div className="font-medium">{hint.to}</div>
                                <div className="text-gray-600">{hint.description}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Select a piece to see possible moves</p>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {showChat && (
                  <Card className="flex-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">💬 Game Chat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ScrollArea className="h-40">
                        <div className="space-y-2">
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-2 rounded text-xs ${
                                msg.type === 'system' ? 'bg-gray-100 text-gray-600' :
                                msg.playerId === playerId ? 'bg-blue-100 text-blue-800 ml-4' :
                                'bg-gray-50 text-gray-800 mr-4'
                              }`}
                            >
                              {msg.type !== 'system' && (
                                <div className="font-medium text-xs opacity-75">
                                  {msg.playerId === playerId ? 'You' : 'Milla'}
                                </div>
                              )}
                              <div>{msg.message}</div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={sendChatMessage}>
                          Send
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}