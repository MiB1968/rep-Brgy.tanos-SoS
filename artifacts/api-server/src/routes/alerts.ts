import { Router } from "express";
import { eq, and, or, inArray } from "drizzle-orm";
import { db, alertsTable, alertMessagesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const alertShape = (a: typeof alertsTable.$inferSelect) => ({
  id: a.id,
  residentId: a.residentId ?? null,
  residentName: a.residentName ?? null,
  type: a.type,
  status: a.status,
  location: a.location,
  description: a.description ?? null,
  severityScore: a.severityScore ?? null,
  assignedTo: a.assignedTo ?? null,
  assignedToName: a.assignedToName ?? null,
  respondedBy: a.respondedBy ?? null,
  respondedByName: a.respondedByName ?? null,
  respondedAt: a.respondedAt?.toISOString() ?? null,
  resolvedAt: a.resolvedAt?.toISOString() ?? null,
  resolutionNotes: a.resolutionNotes ?? null,
  responderNotes: a.responderNotes ?? null,
  createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
  updatedAt: a.updatedAt?.toISOString() ?? new Date().toISOString(),
});

const msgShape = (m: typeof alertMessagesTable.$inferSelect) => ({
  id: m.id,
  alertId: m.alertId ?? "",
  senderId: m.senderId ?? "",
  senderName: m.senderName ?? "",
  senderRole: m.senderRole ?? "resident",
  message: m.message,
  timestamp: m.timestamp?.toISOString() ?? new Date().toISOString(),
});

router.get("/alerts", requireAuth, async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  const residentId = req.query.residentId as string | undefined;
  const role = req.user!.role;
  const userId = req.user!.id;

  let rows: (typeof alertsTable.$inferSelect)[];

  if (role === "resident") {
    if (residentId && residentId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    rows = await db.select().from(alertsTable).where(eq(alertsTable.residentId, userId));
  } else {
    if (status) {
      const statuses = status.split(",");
      rows = await db.select().from(alertsTable).where(inArray(alertsTable.status, statuses));
    } else {
      rows = await db.select().from(alertsTable);
    }
  }

  rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  res.json(rows.map(alertShape));
});

router.post("/alerts", requireAuth, async (req, res): Promise<void> => {
  const { type, location, description } = req.body;
  if (!type || !location) {
    res.status(400).json({ error: "type and location are required" });
    return;
  }
  const [alert] = await db.insert(alertsTable).values({
    residentId: req.user!.id,
    residentName: req.user!.name,
    type,
    status: "pending",
    location,
    description: description ?? null,
  }).returning();
  res.status(201).json(alertShape(alert));
});

router.get("/alerts/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [alert] = await db.select().from(alertsTable).where(eq(alertsTable.id, id));
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(alertShape(alert));
});

router.patch("/alerts/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status, assignedTo, assignedToName, resolutionNotes, responderNotes } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status) updates.status = status;
  if (assignedTo !== undefined) updates.assignedTo = assignedTo;
  if (assignedToName !== undefined) updates.assignedToName = assignedToName;
  if (resolutionNotes !== undefined) updates.resolutionNotes = resolutionNotes;
  if (responderNotes !== undefined) updates.responderNotes = responderNotes;

  const [updated] = await db.update(alertsTable).set(updates).where(eq(alertsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(alertShape(updated));
});

// Alias: respond to alert (redirects to patch)
router.post("/alerts/:id/respond", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(alertsTable).set({
    status: "responding",
    respondedBy: req.user!.id,
    respondedByName: req.user!.name,
    respondedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(alertsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(alertShape(updated));
});

// Alias: resolve alert
router.post("/alerts/:id/resolve", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { resolutionNotes } = req.body;
  const [updated] = await db.update(alertsTable).set({
    status: "resolved",
    resolvedAt: new Date(),
    resolutionNotes: resolutionNotes ?? null,
    updatedAt: new Date(),
  }).where(eq(alertsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(alertShape(updated));
});

// Alias: cancel alert
router.post("/alerts/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(alertsTable).set({
    status: "cancelled",
    updatedAt: new Date(),
  }).where(eq(alertsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(alertShape(updated));
});

router.get("/alerts/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const messages = await db.select().from(alertMessagesTable)
    .where(eq(alertMessagesTable.alertId, id));
  messages.sort((a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0));
  res.json(messages.map(msgShape));
});

router.post("/alerts/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  const [msg] = await db.insert(alertMessagesTable).values({
    alertId: id,
    senderId: req.user!.id,
    senderName: req.user!.name,
    senderRole: req.user!.role,
    message,
  }).returning();
  res.status(201).json(msgShape(msg));
});

export default router;
