import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, shiftsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router = Router();

const shiftShape = (s: typeof shiftsTable.$inferSelect) => ({
  id: s.id,
  tanodId: s.tanodId ?? "",
  tanodName: s.tanodName ?? "",
  startTime: s.startTime?.toISOString() ?? "",
  endTime: s.endTime?.toISOString() ?? "",
  sector: s.sector ?? "",
  status: s.status ?? "scheduled",
  tanodResponse: s.tanodResponse ?? null,
  notes: s.notes ?? null,
  createdAt: s.createdAt?.toISOString() ?? new Date().toISOString(),
});

router.get("/shifts", requireAuth, async (req, res): Promise<void> => {
  const tanodId = req.query.tanodId as string | undefined;
  const status = req.query.status as string | undefined;

  let rows: (typeof shiftsTable.$inferSelect)[];
  if (req.user!.role === "tanod") {
    rows = await db.select().from(shiftsTable).where(eq(shiftsTable.tanodId, req.user!.id));
  } else if (tanodId && status) {
    rows = await db.select().from(shiftsTable).where(and(eq(shiftsTable.tanodId, tanodId), eq(shiftsTable.status, status)));
  } else if (tanodId) {
    rows = await db.select().from(shiftsTable).where(eq(shiftsTable.tanodId, tanodId));
  } else {
    rows = await db.select().from(shiftsTable);
  }

  rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  res.json(rows.map(shiftShape));
});

router.post("/shifts", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const { tanodId, tanodName, startTime, endTime, sector, notes } = req.body;
  if (!tanodId || !startTime || !endTime || !sector) {
    res.status(400).json({ error: "tanodId, startTime, endTime, sector are required" });
    return;
  }
  const [shift] = await db.insert(shiftsTable).values({
    tanodId,
    tanodName: tanodName ?? "",
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    sector,
    status: "scheduled",
    tanodResponse: "pending",
    notes: notes ?? null,
  }).returning();
  res.status(201).json(shiftShape(shift));
});

router.post("/shifts/:id/respond", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { response } = req.body;
  if (!["accepted", "rejected"].includes(response)) {
    res.status(400).json({ error: "response must be accepted or rejected" });
    return;
  }
  const [updated] = await db.update(shiftsTable).set({ tanodResponse: response })
    .where(eq(shiftsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Shift not found" });
    return;
  }
  res.json(shiftShape(updated));
});

export default router;
