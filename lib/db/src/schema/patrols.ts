import { pgTable, text, uuid, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const patrolsTable = pgTable("patrols", {
  tanodId: uuid("tanod_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  tanodName: text("tanod_name"),
  isActive: boolean("is_active").default(false),
  location: jsonb("location"),
  status: text("status"),
  lastPing: timestamp("last_ping", { withTimezone: true }).defaultNow(),
});

export const insertPatrolSchema = createInsertSchema(patrolsTable);
export type InsertPatrol = z.infer<typeof insertPatrolSchema>;
export type Patrol = typeof patrolsTable.$inferSelect;
