import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { alertsTable } from "./alerts";
import { usersTable } from "./users";

export const alertMessagesTable = pgTable("alert_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  alertId: uuid("alert_id").references(() => alertsTable.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => usersTable.id),
  senderName: text("sender_name"),
  senderRole: text("sender_role"),
  message: text("message").notNull(),
  type: text("type").default("text"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
});

export const insertAlertMessageSchema = createInsertSchema(alertMessagesTable).omit({
  id: true,
  timestamp: true,
});
export type InsertAlertMessage = z.infer<typeof insertAlertMessageSchema>;
export type AlertMessage = typeof alertMessagesTable.$inferSelect;
