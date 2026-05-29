import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const alertsTable = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  residentId: uuid("resident_id").references(() => usersTable.id),
  residentName: text("resident_name"),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  barangayId: text("barangay_id").default("default"),
  location: jsonb("location").notNull(),
  description: text("description"),
  severityScore: integer("severity_score"),
  assignedTo: uuid("assigned_to"),
  assignedToName: text("assigned_to_name"),
  respondedBy: uuid("responded_by"),
  respondedByName: text("responded_by_name"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  resolutionNotes: text("resolution_notes"),
  responderNotes: text("responder_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
