import { Router } from "express";
import { eq, sql, and, gte, avg } from "drizzle-orm";
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

  // FIX: compute real avg response time from DB instead of hardcoding 12.5
  const [avgRow] = await db.select({
    avgMs: avg(
      sql<number>`extract(epoch from (${alertsTable.respondedAt} - ${alertsTable.createdAt})) * 1000`,
    ),
  })
    .from(alertsTable)
    .where(sql`${alertsTable.respondedAt} is not null`);

  const avgResponseTimeMinutes =
    avgRow?.avgMs != null
      ? Math.round((Number(avgRow.avgMs) / 60000) * 10) / 10
      : null;

  res.json({
    totalAlerts: totalAlertsRow?.count ?? 0,
    activeAlerts: activeAlertsRow?.count ?? 0,
    resolvedToday: resolvedTodayRow?.count ?? 0,
    activeTanods: activeTanodsRow?.count ?? 0,
    pendingUsers: pendingUsersRow?.count ?? 0,
    totalResidents: totalResidentsRow?.count ?? 0,
    avgResponseTimeMinutes,
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

// FIX: removed Math.random() for avgResponseTimeMinutes — now computed from
// real responded_at / created_at timestamps. Returns null when no data yet.
router.get("/stats/tanod-performance", requireAuth, async (_req, res): Promise<void> => {
  const tanods = await db.select().from(usersTable).where(eq(usersTable.role, "tanod"));

  const result = await Promise.all(tanods.map(async (t) => {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(alertsTable)
      .where(eq(alertsTable.respondedBy, t.id));

    const [avgRow] = await db
      .select({
        avgMs: avg(
          sql<number>`extract(epoch from (${alertsTable.respondedAt} - ${alertsTable.createdAt})) * 1000`,
        ),
      })
      .from(alertsTable)
      .where(
        and(
          eq(alertsTable.respondedBy, t.id),
          sql`${alertsTable.respondedAt} is not null`,
        ),
      );

    const avgResponseTimeMinutes =
      avgRow?.avgMs != null
        ? Math.round((Number(avgRow.avgMs) / 60000) * 10) / 10
        : null;

    return {
      tanodId: t.id,
      tanodName: t.name,
      alertsResponded: countRow?.count ?? 0,
      avgResponseTimeMinutes,
    };
  }));

  res.json(result);
});

export default router;
