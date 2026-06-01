import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("resident"),
  status: text("status").notNull().default("pending"),
  phone: text("phone"),
  address: text("address"),
  barangayId: text("barangay_id").default("default"),
  tokenVersion: integer("token_version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastActive: timestamp("last_active", { withTimezone: true }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  tokenVersion: true,
  createdAt: true,
  lastActive: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
