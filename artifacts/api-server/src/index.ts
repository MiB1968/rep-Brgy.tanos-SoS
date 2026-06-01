import http from 'http';
import WebSocket from 'ws';
import app from './app';
import { logger } from './lib/logger';
import {
  getWebSocketManager,
  authenticateWebSocketConnection,
  handleWebSocketMessage,
  handleWebSocketError,
  handleWebSocketDisconnect,
  type WebSocketContext,
} from './lib/websocket';

const rawPort = process.env['PORT'];

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket server
const wss = new WebSocket.Server({ server, path: '/api/ws' });

wss.on('connection', async (ws, req) => {
  // Extract token from query params: /api/ws?token=...
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    logger.warn('WebSocket connection attempted without token');
    ws.close(1008, 'Missing authentication token');
    return;
  }

  // Authenticate the connection
  const authResult = await authenticateWebSocketConnection(token);
  if (!authResult) {
    logger.warn('WebSocket authentication failed');
    ws.close(1008, 'Invalid or expired token');
    return;
  }

  const ctx: WebSocketContext = {
    ws,
    userId: authResult.userId,
    role: authResult.role,
    token,
  };

  // Register client with WebSocket manager
  const wsManager = getWebSocketManager();
  wsManager.addClient(ws, ctx.userId, ctx.role);

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: 'ACK',
      data: {
        connected: true,
        userId: ctx.userId,
        role: ctx.role,
        timestamp: Date.now(),
      },
    }),
  );

  // Handle incoming messages
  ws.on('message', async (data: WebSocket.Data) => {
    try {
      const message = data.toString('utf-8');
      await handleWebSocketMessage(ctx, message);
    } catch (error) {
      handleWebSocketError(
        ctx,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    handleWebSocketError(ctx, error);
  });

  // Handle disconnect
  ws.on('close', () => {
    handleWebSocketDisconnect(ctx.userId);
  });
});

// Start server
server.listen(port, (err) => {
  if (err) {
    logger.error({ err }, 'Error listening on port');
    process.exit(1);
  }

  logger.info(
    { port, wsPath: '/api/ws' },
    'Server listening with WebSocket support',
  );
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
