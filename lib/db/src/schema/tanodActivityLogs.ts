import { pgTable, text, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tanodActivityLogsTable = pgTable("tanod_activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tanodId: uuid("tanod_id").references(() => usersTable.id, { onDelete: "cascade" }),
  tanodName: text("tanod_name"),
  type: text("type"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  details: text("details"),
  location: jsonb("location"),
});

export const insertTanodActivityLogSchema = createInsertSchema(tanodActivityLogsTable).omit({
  id: true,
  timestamp: true,
});
export type InsertTanodActivityLog = z.infer<typeof insertTanodActivityLogSchema>;
export type TanodActivityLog = typeof tanodActivityLogsTable.$inferSelect;
