import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { alertsTable } from "./alerts";

export const broadcastsTable = pgTable("system_broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  incidentId: uuid("incident_id").references(() => alertsTable.id),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  isActive: boolean("is_active").default(false),
  adminId: uuid("admin_id"),
  adminName: text("admin_name"),
  type: text("type"),
  approvalStatus: text("approval_status").default("pending"),
});

export const insertBroadcastSchema = createInsertSchema(broadcastsTable).omit({
  id: true,
  timestamp: true,
});
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;
export type Broadcast = typeof broadcastsTable.$inferSelect;
