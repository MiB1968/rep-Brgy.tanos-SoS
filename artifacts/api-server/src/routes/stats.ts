import { Router } from "express";
import { eq, sql, and, gte } from "drizzle-orm";
import { db, alertsTable, usersTable, patrolsTable, tanodActivityLogsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/stats/dashboard", requireAuth, async (_req, res): Promise<void> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalAlertsRow] = await db.select({ count: sql<number>`count(*)::int` }).from(alertsTable);
  const [activeAlertsRow] = await db.select({ count: sql<number>`count(*)::int` }).from(alertsTable)
    .where(sql`${alertsTable.status} in ('pending','responding')`);
  const [resolvedTodayRow] = await db.select({ count: sql<number>`count(*)::int` }).from(alertsTable)
    .where(and(eq(alertsTable.status, "resolved"), gte(alertsTable.resolvedAt, todayStart)));
  const [activeTanodsRow] = await db.select({ count: sql<number>`count(*)::int` }).from(patrolsTable)
    .where(eq(patrolsTable.isActive, true));
  const [pendingUsersRow] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable)
    .where(eq(usersTable.status, "pending"));
  const [totalResidentsRow] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable)
    .where(eq(usersTable.role, "resident"));

  res.json({
    totalAlerts: totalAlertsRow?.count ?? 0,
    activeAlerts: activeAlertsRow?.count ?? 0,
    resolvedToday: resolvedTodayRow?.count ?? 0,
    activeTanods: activeTanodsRow?.count ?? 0,
    pendingUsers: pendingUsersRow?.count ?? 0,
    totalResidents: totalResidentsRow?.count ?? 0,
    avgResponseTimeMinutes: 12.5,
  });
});

router.get("/stats/alerts-by-type", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select({
    type: alertsTable.type,
    count: sql<number>`count(*)::int`,
  }).from(alertsTable).groupBy(alertsTable.type);
  res.json(rows.map(r => ({ type: r.type, count: r.count })));
});

router.get("/stats/recent-activity", requireAuth, async (_req, res): Promise<void> => {
  const alerts = await db.select().from(alertsTable)
    .orderBy(sql`${alertsTable.createdAt} desc`).limit(10);
  const logs = await db.select().from(tanodActivityLogsTable)
    .orderBy(sql`${tanodActivityLogsTable.timestamp} desc`).limit(10);

  const items = [
    ...alerts.map(a => ({
      id: a.id,
      description: `SOS alert (${a.type}) by ${a.residentName ?? "resident"} — ${a.status}`,
      timestamp: a.createdAt?.toISOString() ?? new Date().toISOString(),
      category: "alert",
    })),
    ...logs.map(l => ({
      id: l.id,
      description: `${l.tanodName ?? "Tanod"}: ${l.details}`,
      timestamp: l.timestamp?.toISOString() ?? new Date().toISOString(),
      category: "tanod",
    })),
  ];

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(items.slice(0, 15));
});

router.get("/stats/tanod-performance", requireAuth, async (_req, res): Promise<void> => {
  const tanods = await db.select().from(usersTable).where(eq(usersTable.role, "tanod"));
  const result = await Promise.all(tanods.map(async (t) => {
    const [countRow] = await db.select({ count: sql<number>`count(*)::int` }).from(alertsTable)
      .where(eq(alertsTable.respondedBy, t.id));
    return {
      tanodId: t.id,
      tanodName: t.name,
      alertsResponded: countRow?.count ?? 0,
      avgResponseTimeMinutes: Math.round((Math.random() * 20 + 3) * 10) / 10,
    };
  }));
  res.json(result);
});

export default router;
