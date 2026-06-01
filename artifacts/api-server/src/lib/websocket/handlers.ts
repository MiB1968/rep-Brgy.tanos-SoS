import WebSocket from 'ws';
import { getWebSocketManager, type LocationUpdate, type WebSocketMessage } from './manager';
import { logger } from '../logger';
import { verifyToken } from '../jwt';

export interface WebSocketContext {
  ws: WebSocket;
  userId: string;
  role: string;
  token: string;
}

/**
 * Authenticate WebSocket connection via JWT token from URL query param
 */
export async function authenticateWebSocketConnection(
  token: string,
): Promise<{ userId: string; role: string } | null> {
  try {
    const decoded = verifyToken(token);
    return {
      userId: decoded.sub || '',
      role: decoded.role || 'citizen',
    };
  } catch (error) {
    logger.warn({ error }, 'WebSocket authentication failed');
    return null;
  }
}

/**
 * Handle incoming WebSocket message
 */
export async function handleWebSocketMessage(
  ctx: WebSocketContext,
  rawMessage: string,
): Promise<void> {
  try {
    const message: WebSocketMessage & { data?: unknown } = JSON.parse(
      rawMessage,
    );

    switch (message.type) {
      case 'LOCATION_UPDATE':
        await handleLocationUpdate(ctx, message);
        break;
      default:
        logger.warn(
          { type: message.type, userId: ctx.userId },
          'Unknown message type',
        );
    }
  } catch (error) {
    logger.error({ error, userId: ctx.userId }, 'Failed to handle message');
    ctx.ws.send(
      JSON.stringify({
        type: 'ERROR',
        error: 'Invalid message format',
      }),
    );
  }
}

/**
 * Handle location update from Tanod
 */
async function handleLocationUpdate(
  ctx: WebSocketContext,
  message: WebSocketMessage & { data?: unknown },
): Promise<void> {
  // Only Tanods and Admins can send location updates
  if (ctx.role !== 'tanod' && ctx.role !== 'admin') {
    ctx.ws.send(
      JSON.stringify({
        type: 'ERROR',
        error: 'Unauthorized: only tanods can update location',
      }),
    );
    return;
  }

  const locationData = message.data as Record<string, unknown> | undefined;
  if (!locationData) {
    ctx.ws.send(
      JSON.stringify({
        type: 'ERROR',
        error: 'Missing location data',
      }),
    );
    return;
  }

  // Validate location data
  const latitude = Number(locationData.latitude);
  const longitude = Number(locationData.longitude);
  const accuracy = Number(locationData.accuracy);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    ctx.ws.send(
      JSON.stringify({
        type: 'ERROR',
        error: 'Invalid latitude or longitude',
      }),
    );
    return;
  }

  if (accuracy < 0 || accuracy > 10000) {
    ctx.ws.send(
      JSON.stringify({
        type: 'ERROR',
        error: 'Invalid accuracy value',
      }),
    );
    return;
  }

  const update: LocationUpdate = {
    tanodId: ctx.userId,
    latitude,
    longitude,
    accuracy,
    heading: Number(locationData.heading) || undefined,
    speed: Number(locationData.speed) || undefined,
    timestamp: Date.now(),
  };

  // Process update
  const wsManager = getWebSocketManager();
  wsManager.handleLocationUpdate(update);

  // Send acknowledgment
  ctx.ws.send(
    JSON.stringify({
      type: 'ACK',
      id: message.id,
      data: { received: true },
    }),
  );

  logger.debug(
    {
      tanodId: ctx.userId,
      lat: latitude,
      lng: longitude,
      accuracy,
    },
    'Location update received',
  );
}

/**
 * Handle WebSocket connection error
 */
export function handleWebSocketError(
  ctx: WebSocketContext,
  error: Error,
): void {
  logger.error(
    { userId: ctx.userId, error: error.message },
    'WebSocket error',
  );
}

/**
 * Handle WebSocket disconnection
 */
export function handleWebSocketDisconnect(userId: string): void {
  const wsManager = getWebSocketManager();
  wsManager.removeClient(userId);
}
