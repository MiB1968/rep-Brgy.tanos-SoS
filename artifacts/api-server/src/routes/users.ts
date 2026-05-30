import { Router } from "express";
import { eq, and, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router = Router();

const userShape = (u: typeof usersTable.$inferSelect) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  phone: u.phone ?? null,
  address: u.address ?? null,
  barangayId: u.barangayId ?? null,
  createdAt: u.createdAt?.toISOString() ?? new Date().toISOString(),
  lastActive: u.lastActive?.toISOString() ?? null,
});

router.get("/users", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const role = req.query.role as string | undefined;
  const status = req.query.status as string | undefined;

  let query = db.select().from(usersTable).$dynamic();
  if (role && status) {
    query = query.where(and(eq(usersTable.role, role), eq(usersTable.status, status)));
  } else if (role) {
    query = query.where(eq(usersTable.role, role));
  } else if (status) {
    query = query.where(eq(usersTable.status, status));
  }

  const users = await query;
  res.json(users.map(userShape));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(userShape(user));
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (req.user!.id !== id && !["admin", "superadmin"].includes(req.user!.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { name, phone, address, status, role } = req.body;
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (status && ["admin", "superadmin"].includes(req.user!.role)) updates.status = status;
  if (role && ["admin", "superadmin"].includes(req.user!.role)) updates.role = role;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(userShape(updated));
});

router.post("/users/:id/approve", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(usersTable).set({ status: "approved" }).where(eq(usersTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(userShape(updated));
});

router.post("/users/:id/reject", requireAuth, requireRole("admin", "superadmin"), async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [updated] = await db.update(usersTable).set({
    status: "rejected",
  }).where(eq(usersTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(userShape(updated));
});

export default router;
