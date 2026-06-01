import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const shiftsTable = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tanodId: uuid("tanod_id").references(() => usersTable.id, { onDelete: "cascade" }),
  tanodName: text("tanod_name"),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  sector: text("sector"),
  status: text("status").default("scheduled"),
  tanodResponse: text("tanod_response").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertShiftSchema = createInsertSchema(shiftsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shiftsTable.$inferSelect;
