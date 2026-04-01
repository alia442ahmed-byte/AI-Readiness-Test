import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Leads table — stores every AI Readiness Assessment submission.
 * Captures contact info, quiz answers, and the calculated score.
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  /** Full name entered by the lead */
  name: varchar("name", { length: 255 }).notNull(),
  /** Work email address */
  email: varchar("email", { length: 320 }).notNull(),
  /** Company name */
  company: varchar("company", { length: 255 }).notNull(),
  /** Calculated AI Readiness Score (0–100) */
  score: int("score").notNull(),
  /** Score tier: high_risk | moderate_risk | optimized */
  tier: mysqlEnum("tier", ["high_risk", "moderate_risk", "optimized"]).notNull(),
  /** Raw quiz answers as JSON array of point values e.g. [1,3,2,4,2] */
  answers: json("answers").notNull(),
  /** Timestamp of submission */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;