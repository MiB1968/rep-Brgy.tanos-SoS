import { pgTable, text, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { alertsTable } from "./alerts";

export const incidentsTable = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  alertId: uuid("alert_id").references(() => alertsTable.id, { onDelete: "set null" }),
  tanodId: uuid("tanod_id").references(() => usersTable.id, { onDelete: "set null" }),
  tanodName: text("tanod_name"),
  type: text("type"),
  status: text("status").default("pending"),
  location: text("location"),
  gpsLocation: jsonb("gps_location"),
  description: text("description"),
  personsInvolved: text("persons_involved"),
  actionsTaken: text("actions_taken"),
  citizenName: text("citizen_name"),
  barangayId: text("barangay_id").default("default"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolutionNotes: text("resolution_notes"),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({
  id: true,
  timestamp: true,
});
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidentsTable.$inferSelect;
