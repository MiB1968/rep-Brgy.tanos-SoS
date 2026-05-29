import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, broadcastsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router = Router();

const broadcastShape = (b: typeof broadcastsTable.$inferSelect) => ({
  id: b.id,
  incidentId: b.incidentId ?? null,
  adminId: b.adminId ?? null,
  adminName: b.adminName ?? null,
  type: b.type ?? null,
  message: b.message,
  isActive: b.isActive ?? false,
  approvalStatus: b.approvalStatus ?? null,
  timestamp: b.timestamp?.toISOString() ?? new Date().toISOString(),
});

router.get("/broadcasts", requireAuth, async (req, res): Promise<void> => {
  const isActive = req.query.isActive;
  let rows: (typeof broadcastsTable.$inferSelect)[];
  if (isActive === "true") {
    rows = await db.select().from(broadcastsTable).where(eq(broadcastsTable.isActive, true));
  } else {
    rows = await db.select().from(broadcastsTable);
  }
  rows.sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
  res.json(rows.map(broadcastShape));
});

router.post("/broadcasts", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const { message, type, incidentId } = req.body;
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  const [broadcast] = await db.insert(broadcastsTable).values({
    message,
    type: type ?? "other",
    incidentId: incidentId ?? null,
    adminId: req.user!.id,
    adminName: req.user!.name,
    isActive: true,
    approvalStatus: "approved",
  }).returning();
  res.status(201).json(broadcastShape(broadcast));
});

router.patch("/broadcasts/:id", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { isActive, approvalStatus } = req.body;
  const updates: Record<string, unknown> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (approvalStatus !== undefined) updates.approvalStatus = approvalStatus;
  const [updated] = await db.update(broadcastsTable).set(updates).where(eq(broadcastsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Broadcast not found" });
    return;
  }
  res.json(broadcastShape(updated));
});

export default router;
