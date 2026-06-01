import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, tanodActivityLogsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const logShape = (l: typeof tanodActivityLogsTable.$inferSelect) => ({
  id: l.id,
  tanodId: l.tanodId ?? "",
  tanodName: l.tanodName ?? "",
  type: l.type ?? "",
  timestamp: l.timestamp?.toISOString() ?? new Date().toISOString(),
  details: l.details ?? "",
  location: l.location ?? null,
});

router.get("/logs/tanod", requireAuth, async (req, res): Promise<void> => {
  const tanodId = req.query.tanodId as string | undefined;
  let rows: (typeof tanodActivityLogsTable.$inferSelect)[];
  if (req.user!.role === "tanod") {
    rows = await db.select().from(tanodActivityLogsTable).where(eq(tanodActivityLogsTable.tanodId, req.user!.id));
  } else if (tanodId) {
    rows = await db.select().from(tanodActivityLogsTable).where(eq(tanodActivityLogsTable.tanodId, tanodId));
  } else {
    rows = await db.select().from(tanodActivityLogsTable);
  }
  rows.sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
  res.json(rows.map(logShape));
});

router.post("/logs/tanod", requireAuth, async (req, res): Promise<void> => {
  const { type, details, location } = req.body;
  if (!type || !details) {
    res.status(400).json({ error: "type and details are required" });
    return;
  }
  const [log] = await db.insert(tanodActivityLogsTable).values({
    tanodId: req.user!.id,
    tanodName: req.user!.name,
    type,
    details,
    location: location ?? null,
  }).returning();
  res.status(201).json(logShape(log));
});

export default router;
