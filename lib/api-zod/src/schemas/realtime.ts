import { z } from 'zod';

/**
 * GPS Location schema for client submissions
 */
export const LocationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(10000),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
});

export type LocationUpdate = z.infer<typeof LocationUpdateSchema>;

/**
 * WebSocket message schema
 */
export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('LOCATION_UPDATE'),
    data: LocationUpdateSchema,
    id: z.string().optional(),
  }),
  z.object({
    type: z.literal('ACK'),
    id: z.string().optional(),
    data: z.record(z.unknown()).optional(),
  }),
  z.object({
    type: z.literal('ERROR'),
    error: z.string(),
  }),
  z.object({
    type: z.literal('TANOD_ONLINE'),
    data: z.object({
      tanodId: z.string(),
      timestamp: z.number(),
    }),
  }),
  z.object({
    type: z.literal('TANOD_OFFLINE'),
    data: z.object({
      tanodId: z.string(),
      timestamp: z.number(),
    }),
  }),
]);

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

/**
 * Cached location with timestamp
 */
export const CachedLocationSchema = z.object({
  tanodId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  timestamp: z.number(),
});

export type CachedLocation = z.infer<typeof CachedLocationSchema>;

/**
 * Patrol status response
 */
export const PatrolStatusSchema = z.object({
  tanodId: z.string(),
  tanodName: z.string().nullable(),
  isActive: z.boolean(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number(),
      heading: z.number().optional(),
      speed: z.number().optional(),
      timestamp: z.number(),
    })
    .nullable(),
  status: z.enum(['online', 'offline', 'on-duty', 'off-duty']).nullable(),
  lastPing: z.string().datetime().nullable(),
});

export type PatrolStatus = z.infer<typeof PatrolStatusSchema>;
