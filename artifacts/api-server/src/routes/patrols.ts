import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, patrolsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const patrolShape = (p: typeof patrolsTable.$inferSelect) => ({
  tanodId: p.tanodId,
  tanodName: p.tanodName ?? null,
  isActive: p.isActive ?? false,
  location: p.location ?? null,
  status: p.status ?? null,
  lastPing: p.lastPing?.toISOString() ?? null,
});

router.get("/patrols", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(patrolsTable);
  res.json(rows.map(patrolShape));
});

router.get("/patrols/me", requireAuth, async (req, res): Promise<void> => {
  const [patrol] = await db.select().from(patrolsTable)
    .where(eq(patrolsTable.tanodId, req.user!.id));
  if (!patrol) {
    res.json({ tanodId: req.user!.id, tanodName: req.user!.name, isActive: false, location: null, status: "offline", lastPing: null });
    return;
  }
  res.json(patrolShape(patrol));
});

router.patch("/patrols/me", requireAuth, async (req, res): Promise<void> => {
  const { isActive, location, status } = req.body;
  const updates: Record<string, unknown> = { lastPing: new Date() };
  if (isActive !== undefined) updates.isActive = isActive;
  if (location !== undefined) updates.location = location;
  if (status !== undefined) updates.status = status;

  const existing = await db.select().from(patrolsTable)
    .where(eq(patrolsTable.tanodId, req.user!.id));

  let result;
  if (existing.length === 0) {
    [result] = await db.insert(patrolsTable).values({
      tanodId: req.user!.id,
      tanodName: req.user!.name,
      isActive: isActive ?? false,
      location: location ?? null,
      status: status ?? "offline",
    }).returning();
  } else {
    [result] = await db.update(patrolsTable).set(updates)
      .where(eq(patrolsTable.tanodId, req.user!.id)).returning();
  }

  res.json(patrolShape(result!));
});

export default router;
