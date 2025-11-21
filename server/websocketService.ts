// @ts-expect-error - ws types installed but not recognized
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Game state interfaces
interface GameMove {
  type: 'move';
  gameId: string;
  playerId: string;
  move: any;
  timestamp: number;
}

interface GardenPosition {
  x: number;
  y: number;
}

interface GardenUpdate {
  type: 'garden_move';
  playerId: string;
  position: GardenPosition;
  action?: string;
  timestamp: number;
}

interface StoryChoice {
  type: 'story_choice';
  storyId: string;
  playerId: string;
  choice: string;
  timestamp: number;
}

type WSMessage = GameMove | GardenUpdate | StoryChoice;

// Active connections and game states
const connections = new Map<string, WebSocket>();
const gameStates = new Map<string, any>();
const gardenPositions = new Map<string, GardenPosition>();

export async function setupWebSocketServer(
  httpServer: Server
): Promise<WebSocketServer> {
  console.log('Setting up WebSocket server for real-time features...');

  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
  });

  wss.on('connection', (ws: WebSocket, req: any) => {
    const playerId = generatePlayerId();
    connections.set(playerId, ws);

    console.log(`WebSocket client connected: ${playerId}`);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        playerId,
        message:
          "Connected to Milla's digital world! Ready for gaming, exploration, and storytelling.",
      })
    );

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        handleWebSocketMessage(ws, playerId, message);
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
          })
        );
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket client disconnected: ${playerId}`);
      connections.delete(playerId);
      gardenPositions.delete(playerId);
    });

    ws.on('error', (error: any) => {
      console.error(`WebSocket error for client ${playerId}:`, error);
    });
  });

  console.log('WebSocket server setup complete');
  return wss;
}

function handleWebSocketMessage(
  ws: WebSocket,
  playerId: string,
  message: WSMessage
) {
  switch (message.type) {
    case 'move':
      handleGameMove(ws, playerId, message);
      break;
    case 'garden_move':
      handleGardenMove(ws, playerId, message);
      break;
    case 'story_choice':
      handleStoryChoice(ws, playerId, message);
      break;
    default:
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Unknown message type',
        })
      );
  }
}

function handleGameMove(ws: WebSocket, playerId: string, move: GameMove) {
  // Update game state
  if (!gameStates.has(move.gameId)) {
    gameStates.set(move.gameId, {
      players: [playerId],
      moves: [],
      currentPlayer: playerId,
      created: Date.now(),
    });
  }

  const gameState = gameStates.get(move.gameId)!;
  gameState.moves.push({
    playerId,
    move: move.move,
    timestamp: move.timestamp,
  });

  // Broadcast move to all clients
  const moveUpdate = {
    type: 'game_update',
    gameId: move.gameId,
    move: move.move,
    playerId,
    gameState: {
      moves: gameState.moves,
      currentPlayer: gameState.currentPlayer,
    },
  };

  broadcastToAll(moveUpdate);

  console.log(`Game move processed: ${move.gameId} by ${playerId}`);
}

function handleGardenMove(
  ws: WebSocket,
  playerId: string,
  update: GardenUpdate
) {
  // Update player position
  gardenPositions.set(playerId, update.position);

  // Broadcast position update to all clients
  const positionUpdate = {
    type: 'garden_update',
    playerId,
    position: update.position,
    action: update.action,
    timestamp: update.timestamp,
    allPositions: Object.fromEntries(gardenPositions),
  };

  broadcastToAll(positionUpdate);

  console.log(
    `Garden move: ${playerId} moved to (${update.position.x}, ${update.position.y})`
  );
}

function handleStoryChoice(
  ws: WebSocket,
  playerId: string,
  choice: StoryChoice
) {
  // Simple story choice handling - in a real implementation,
  // this would involve more complex story state management
  const storyUpdate = {
    type: 'story_update',
    storyId: choice.storyId,
    playerId,
    choice: choice.choice,
    timestamp: choice.timestamp,
  };

  broadcastToAll(storyUpdate);

  console.log(
    `Story choice: ${playerId} chose "${choice.choice}" in story ${choice.storyId}`
  );
}

function broadcastToAll(message: any) {
  const messageStr = JSON.stringify(message);
  connections.forEach((ws, playerId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Setup dedicated WebSocket server for mobile sensor data streaming
 * This is optimized for high-frequency, low-latency updates
 */
export async function setupSensorDataWebSocket(
  httpServer: Server
): Promise<WebSocketServer> {
  console.log('Setting up dedicated WebSocket server for sensor data...');

  const { updateAmbientContext } = await import('./realWorldInfoService');

  const sensorWss = new WebSocketServer({
    server: httpServer,
    path: '/ws/sensor',
  });

  sensorWss.on('connection', (ws: WebSocket, req: any) => {
    console.log('Mobile sensor client connected');

    ws.send(
      JSON.stringify({
        type: 'connected',
        message: 'Sensor data WebSocket ready',
      })
    );

    ws.on('message', (data: Buffer) => {
      try {
        const sensorData = JSON.parse(data.toString());

        // Validate basic structure
        if (sensorData.userId && sensorData.timestamp) {
          updateAmbientContext(sensorData.userId, sensorData);

          // Send acknowledgment
          ws.send(
            JSON.stringify({
              type: 'ack',
              timestamp: sensorData.timestamp,
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Invalid sensor data format',
            })
          );
        }
      } catch (error) {
        console.error('Sensor data parsing error:', error);
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Failed to parse sensor data',
          })
        );
      }
    });

    ws.on('close', () => {
      console.log('Mobile sensor client disconnected');
    });

    ws.on('error', (error: any) => {
      console.error('Sensor WebSocket error:', error);
    });
  });

  console.log('Sensor data WebSocket server setup complete on /ws/sensor');
  return sensorWss;
}

export { connections, gameStates, gardenPositions };
