import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  aiName: text("ai_name").default("AI Friend"),
  wakeTime: text("wake_time").default("08:00"),
  waterInterval: integer("water_interval").default(120),
  useVoice: boolean("use_voice").default(false),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  isAi: boolean("is_ai").default(true),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const userSettingsSchema = createInsertSchema(users).pick({
  aiName: true,
  wakeTime: true,
  waterInterval: true,
  useVoice: true,
});

export const insertMessageSchema = createInsertSchema(messages);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type UserSettings = z.infer<typeof userSettingsSchema>;
