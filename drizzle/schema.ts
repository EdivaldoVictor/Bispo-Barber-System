import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }), // Stripe customer ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Conversations table to store chat history between users and the AI assistant.
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).default("New Conversation"),
  status: mysqlEnum("status", ["active", "completed", "archived"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table to store individual chat messages in conversations.
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => conversations.id),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string for storing extracted data like dates, times, services
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Appointments table to store scheduled haircut appointments.
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  conversationId: int("conversationId").references(() => conversations.id),
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 255 }),
  barberName: varchar("barberName", { length: 255 }),
  service: varchar("service", { length: 255 }).notNull(), // e.g., "haircut", "hair_eyebrow", "full_service"
  duration: int("duration").notNull(), // in minutes
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: mysqlEnum("status", ["confirmed", "pending", "completed", "cancelled"]).default("pending"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed", "refunded"]).default("pending"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  priceInCents: int("priceInCents"), // Price in cents
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Training examples table for AI model fine-tuning.
 * Stores example dialogues and expected responses to improve the assistant.
 */
export const trainingExamples = mysqlTable("training_examples", {
  id: int("id").autoincrement().primaryKey(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  userMessage: text("userMessage").notNull(),
  assistantResponse: text("assistantResponse").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "booking", "rescheduling", "cancellation", "inquiry"
  quality: mysqlEnum("quality", ["excellent", "good", "acceptable", "poor"]).default("good"),
  active: int("active").default(1), // 1 for active, 0 for inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingExample = typeof trainingExamples.$inferSelect;
export type InsertTrainingExample = typeof trainingExamples.$inferInsert;

/**
 * AI Models table to track different versions of the trained AI model.
 */
export const aiModels = mysqlTable("ai_models", {
  id: int("id").autoincrement().primaryKey(),
  version: varchar("version", { length: 50 }).notNull().unique(),
  baseModel: varchar("baseModel", { length: 100 }).notNull(), // e.g., "gpt-4", "claude-3"
  trainingExamplesCount: int("trainingExamplesCount").default(0),
  performanceScore: varchar("performanceScore", { length: 10 }), // JSON or decimal score
  isActive: int("isActive").default(0), // 1 for active, 0 for inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIModel = typeof aiModels.$inferSelect;
export type InsertAIModel = typeof aiModels.$inferInsert;

/**
 * Barbershop configuration table for storing business information.
 */
export const barbershopConfig = mysqlTable("barbershop_config", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  businessEmail: varchar("businessEmail", { length: 320 }),
  businessPhone: varchar("businessPhone", { length: 20 }),
  googleCalendarId: varchar("googleCalendarId", { length: 255 }),
  workingHoursStart: varchar("workingHoursStart", { length: 5 }), // HH:MM format
  workingHoursEnd: varchar("workingHoursEnd", { length: 5 }), // HH:MM format
  workingDays: varchar("workingDays", { length: 50 }), // JSON array of day numbers (0-6)
  appointmentDuration: int("appointmentDuration").default(30), // in minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BarbershopConfig = typeof barbershopConfig.$inferSelect;
export type InsertBarbershopConfig = typeof barbershopConfig.$inferInsert;