import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db, patrolsTable } from '@workspace/db';
import { requireAuth } from '../middlewares/requireAuth';
import { getWebSocketManager } from '../lib/websocket';
import { logger } from '../lib/logger';

const router = Router();

const patrolShape = (p: typeof patrolsTable.$inferSelect) => ({
  tanodId: p.tanodId,
  tanodName: p.tanodName ?? null,
  isActive: p.isActive ?? false,
  location: p.location ?? null,
  status: p.status ?? null,
  lastPing: p.lastPing?.toISOString() ?? null,
});

/**
 * Get all patrols with current location data
 * Merges DB data with real-time WebSocket cache
 */
router.get('/patrols', requireAuth, async (_req, res): Promise<void> => {
  try {
    const rows = await db.select().from(patrolsTable);
    const wsManager = getWebSocketManager();
    const cachedLocations = wsManager.getAllLocations();

    // Create location lookup map
    const locationMap = new Map(
      cachedLocations.map((loc) => [loc.tanodId, loc]),
    );

    const patrols = rows.map((patrol) => {
      const shape = patrolShape(patrol);
      const cachedLocation = locationMap.get(patrol.tanodId);

      // If we have fresh location data from WebSocket, use it
      if (cachedLocation) {
        return {
          ...shape,
          location: {
            lat: cachedLocation.latitude,
            lng: cachedLocation.longitude,
            accuracy: cachedLocation.accuracy,
            heading: cachedLocation.heading,
            speed: cachedLocation.speed,
            timestamp: cachedLocation.timestamp,
          },
        };
      }

      return shape;
    });

    res.json(patrols);
  } catch (error) {
    logger.error({ error }, 'Error fetching patrols');
    res.status(500).json({ error: 'Failed to fetch patrols' });
  }
});

/**
 * Get current user's patrol status
 */
router.get('/patrols/me', requireAuth, async (req, res): Promise<void> => {
  try {
    const [patrol] = await db
      .select()
      .from(patrolsTable)
      .where(eq(patrolsTable.tanodId, req.user!.id));

    if (!patrol) {
      res.json({
        tanodId: req.user!.id,
        tanodName: req.user!.name,
        isActive: false,
        location: null,
        status: 'offline',
        lastPing: null,
      });
      return;
    }

    const wsManager = getWebSocketManager();
    const cachedLocation = wsManager.getTanodLocation(req.user!.id);

    const shape = patrolShape(patrol);
    if (cachedLocation) {
      return res.json({
        ...shape,
        location: {
          lat: cachedLocation.latitude,
          lng: cachedLocation.longitude,
          accuracy: cachedLocation.accuracy,
          heading: cachedLocation.heading,
          speed: cachedLocation.speed,
          timestamp: cachedLocation.timestamp,
        },
      });
    }

    res.json(shape);
  } catch (error) {
    logger.error({ error }, 'Error fetching current patrol');
    res.status(500).json({ error: 'Failed to fetch patrol status' });
  }
});

/**
 * Update patrol status (on/off duty)
 * Note: Location updates should come via WebSocket for real-time updates
 */
router.patch('/patrols/me', requireAuth, async (req, res): Promise<void> => {
  try {
    const { isActive, status } = req.body;
    const updates: Record<string, unknown> = { lastPing: new Date() };

    if (isActive !== undefined) updates.isActive = isActive;
    if (status !== undefined) updates.status = status;

    const existing = await db
      .select()
      .from(patrolsTable)
      .where(eq(patrolsTable.tanodId, req.user!.id));

    let result;
    if (existing.length === 0) {
      [result] = await db
        .insert(patrolsTable)
        .values({
          tanodId: req.user!.id,
          tanodName: req.user!.name,
          isActive: isActive ?? false,
          location: null,
          status: status ?? 'offline',
        })
        .returning();
    } else {
      [result] = await db
        .update(patrolsTable)
        .set(updates)
        .where(eq(patrolsTable.tanodId, req.user!.id))
        .returning();
    }

    res.json(patrolShape(result!));
  } catch (error) {
    logger.error({ error }, 'Error updating patrol status');
    res.status(500).json({ error: 'Failed to update patrol status' });
  }
});

/**
 * Get WebSocket manager stats (admin only)
 */
router.get('/patrols/stats/ws', requireAuth, async (req, res): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const wsManager = getWebSocketManager();
    const stats = wsManager.getStats();
    res.json(stats);
  } catch (error) {
    logger.error({ error }, 'Error fetching WebSocket stats');
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
