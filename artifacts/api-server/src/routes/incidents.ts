import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, incidentsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const incidentShape = (i: typeof incidentsTable.$inferSelect) => ({
  id: i.id,
  alertId: i.alertId ?? null,
  tanodId: i.tanodId ?? "",
  tanodName: i.tanodName ?? "",
  type: i.type ?? "",
  status: i.status ?? "pending",
  location: i.location ?? null,
  gpsLocation: i.gpsLocation ?? null,
  description: i.description ?? "",
  personsInvolved: i.personsInvolved ?? null,
  actionsTaken: i.actionsTaken ?? null,
  citizenName: i.citizenName ?? null,
  timestamp: i.timestamp?.toISOString() ?? new Date().toISOString(),
  resolvedAt: i.resolvedAt?.toISOString() ?? null,
  resolutionNotes: i.resolutionNotes ?? null,
});

router.get("/incidents", requireAuth, async (req, res): Promise<void> => {
  const tanodId = req.query.tanodId as string | undefined;
  const status = req.query.status as string | undefined;

  let rows: (typeof incidentsTable.$inferSelect)[];
  if (req.user!.role === "tanod") {
    if (status) {
      rows = await db.select().from(incidentsTable)
        .where(and(eq(incidentsTable.tanodId, req.user!.id), eq(incidentsTable.status, status)));
    } else {
      rows = await db.select().from(incidentsTable)
        .where(eq(incidentsTable.tanodId, req.user!.id));
    }
  } else if (tanodId) {
    rows = await db.select().from(incidentsTable).where(eq(incidentsTable.tanodId, tanodId));
  } else {
    rows = await db.select().from(incidentsTable);
  }

  rows.sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
  res.json(rows.map(incidentShape));
});

router.post("/incidents", requireAuth, async (req, res): Promise<void> => {
  const { alertId, type, status, location, gpsLocation, description, personsInvolved, actionsTaken, citizenName } = req.body;
  const [incident] = await db.insert(incidentsTable).values({
    alertId: alertId ?? null,
    tanodId: req.user!.id,
    tanodName: req.user!.name,
    type: type ?? "Other",
    status: status ?? "pending",
    location: location ?? null,
    gpsLocation: gpsLocation ?? null,
    description: description ?? "",
    personsInvolved: personsInvolved ?? null,
    actionsTaken: actionsTaken ?? null,
    citizenName: citizenName ?? null,
  }).returning();
  res.status(201).json(incidentShape(incident));
});

router.get("/incidents/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [incident] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  res.json(incidentShape(incident));
});

router.patch("/incidents/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status, actionsTaken, resolutionNotes } = req.body;
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (actionsTaken !== undefined) updates.actionsTaken = actionsTaken;
  if (resolutionNotes !== undefined) updates.resolutionNotes = resolutionNotes;
  if (status === "resolved") updates.resolvedAt = new Date();

  const [updated] = await db.update(incidentsTable).set(updates).where(eq(incidentsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  res.json(incidentShape(updated));
});

export default router;
