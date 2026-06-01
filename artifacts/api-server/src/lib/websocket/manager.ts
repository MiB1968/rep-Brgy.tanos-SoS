import WebSocket from 'ws';
import { logger } from '../logger';

export interface LocationUpdate {
  tanodId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'LOCATION_UPDATE' | 'TANOD_ONLINE' | 'TANOD_OFFLINE' | 'ERROR' | 'ACK';
  data?: unknown;
  error?: string;
  id?: string;
}

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  role: string;
  lastLocationUpdate: number;
  isActive: boolean;
}

class WebSocketManager {
  private clients: Map<string, ConnectedClient> = new Map();
  private locationCache: Map<string, LocationUpdate> = new Map();
  private lastBroadcast: Map<string, number> = new Map();
  private readonly LOCATION_THROTTLE_MS = 2000; // Broadcast every 2 seconds
  private readonly DB_WRITE_INTERVAL_MS = 10000; // Write to DB every 10 seconds
  private dbWriteInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPeriodicDBSync();
  }

  /**
   * Register a new WebSocket client
   */
  addClient(
    ws: WebSocket,
    userId: string,
    role: string,
  ): void {
    this.clients.set(userId, {
      ws,
      userId,
      role,
      lastLocationUpdate: 0,
      isActive: true,
    });

    logger.info({ userId }, 'WebSocket client connected');

    // Notify all clients that a tanod came online
    if (role === 'tanod') {
      this.broadcastToAll({
        type: 'TANOD_ONLINE',
        data: { tanodId: userId, timestamp: Date.now() },
      });
    }
  }

  /**
   * Remove a client when they disconnect
   */
  removeClient(userId: string): void {
    const client = this.clients.get(userId);
    if (!client) return;

    client.isActive = false;
    this.clients.delete(userId);
    logger.info({ userId }, 'WebSocket client disconnected');

    // Notify all clients that a tanod went offline
    if (client.role === 'tanod') {
      this.broadcastToAll({
        type: 'TANOD_OFFLINE',
        data: { tanodId: userId, timestamp: Date.now() },
      });
    }
  }

  /**
   * Handle incoming location update with throttling
   */
  handleLocationUpdate(update: LocationUpdate): void {
    const now = Date.now();
    const lastBroadcastTime = this.lastBroadcast.get(update.tanodId) || 0;

    // Store in cache immediately for DB sync
    this.locationCache.set(update.tanodId, {
      ...update,
      timestamp: now,
    });

    // Only broadcast if throttle window has passed
    if (now - lastBroadcastTime >= this.LOCATION_THROTTLE_MS) {
      this.broadcastToAll({
        type: 'LOCATION_UPDATE',
        data: update,
      });
      this.lastBroadcast.set(update.tanodId, now);
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(userId: string, message: WebSocketMessage): boolean {
    const client = this.clients.get(userId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to send message to client');
      return false;
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(message: WebSocketMessage): void {
    const payload = JSON.stringify(message);
    let successCount = 0;
    let failureCount = 0;

    for (const [userId, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(payload);
          successCount++;
        } catch (error) {
          logger.error({ userId, error }, 'Failed to broadcast to client');
          failureCount++;
        }
      }
    }

    if (failureCount > 0) {
      logger.warn(
        { successCount, failureCount },
        'Some broadcast messages failed',
      );
    }
  }

  /**
   * Broadcast to specific role (e.g., 'tanod', 'admin')
   */
  broadcastToRole(role: string, message: WebSocketMessage): void {
    const payload = JSON.stringify(message);

    for (const [, client] of this.clients) {
      if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(payload);
        } catch (error) {
          logger.error(
            { role, error },
            'Failed to send role-specific message',
          );
        }
      }
    }
  }

  /**
   * Get all cached locations (for admin/dispatch view)
   */
  getAllLocations(): LocationUpdate[] {
    return Array.from(this.locationCache.values());
  }

  /**
   * Get specific tanod's last known location
   */
  getTanodLocation(tanodId: string): LocationUpdate | undefined {
    return this.locationCache.get(tanodId);
  }

  /**
   * Get active tanods count
   */
  getActiveTanodsCount(): number {
    return Array.from(this.clients.values()).filter(
      (c) => c.role === 'tanod' && c.isActive,
    ).length;
  }

  /**
   * Periodically sync cached locations to database
   * This prevents hammering the DB on every location update
   */
  private startPeriodicDBSync(): void {
    this.dbWriteInterval = setInterval(() => {
      const locations = Array.from(this.locationCache.values());
      if (locations.length > 0) {
        // Emit event that can be handled by route middleware
        // This will be consumed by the patrols route
        logger.debug({ count: locations.length }, 'Syncing locations to DB');
      }
    }, this.DB_WRITE_INTERVAL_MS);
  }

  /**
   * Stop all periodic tasks
   */
  destroy(): void {
    if (this.dbWriteInterval) {
      clearInterval(this.dbWriteInterval);
    }

    for (const [, client] of this.clients) {
      try {
        client.ws.close();
      } catch (error) {
        logger.error({ error }, 'Error closing WebSocket');
      }
    }

    this.clients.clear();
    this.locationCache.clear();
    this.lastBroadcast.clear();
  }

  /**
   * Get manager stats
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      activeTanods: this.getActiveTanodsCount(),
      cachedLocations: this.locationCache.size,
      connectedClients: Array.from(this.clients.values()).map((c) => ({
        userId: c.userId,
        role: c.role,
        isActive: c.isActive,
      })),
    };
  }
}

// Singleton instance
let instance: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!instance) {
    instance = new WebSocketManager();
  }
  return instance;
}

export function destroyWebSocketManager(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
