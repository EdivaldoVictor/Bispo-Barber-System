import { eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversations, messages, appointments, trainingExamples, aiModels, barbershopConfig, InsertConversation, InsertMessage, InsertAppointment, InsertTrainingExample, InsertAIModel, InsertBarbershopConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Conversation queries
export async function getConversationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function getConversationById(conversationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createConversation(userId: number, title?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(conversations).values({ userId, title });
  return { insertId: (result as any)[0]?.insertId || 0 };
}

// Message queries
export async function getMessagesByConversationId(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
}

export async function addMessage(conversationId: number, role: "user" | "assistant", content: string, metadata?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(messages).values({ conversationId, role, content, metadata });
}

// Appointment queries
export async function getAppointmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).where(eq(appointments.userId, userId)).orderBy(desc(appointments.scheduledAt));
}

export async function getAllAppointments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).orderBy(desc(appointments.scheduledAt));
}

export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function updateAppointment(appointmentId: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(appointments).set(data).where(eq(appointments.id, appointmentId));
}

// Training examples queries
export async function getTrainingExamples(active?: boolean) {
  const db = await getDb();
  if (!db) return [];
  if (active !== undefined) {
    return db.select().from(trainingExamples).where(eq(trainingExamples.active, active ? 1 : 0));
  }
  return db.select().from(trainingExamples);
}

export async function createTrainingExample(data: InsertTrainingExample) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trainingExamples).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function updateTrainingExample(exampleId: number, data: Partial<InsertTrainingExample>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(trainingExamples).set(data).where(eq(trainingExamples.id, exampleId));
}

// AI Model queries
export async function getActiveAIModel() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiModels).where(eq(aiModels.isActive, 1)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAIModels() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiModels).orderBy(desc(aiModels.createdAt));
}

export async function createAIModel(data: InsertAIModel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(aiModels).values(data);
}

// Barbershop config queries
export async function getBarbershopConfig(ownerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(barbershopConfig).where(eq(barbershopConfig.ownerId, ownerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateBarbershopConfig(data: InsertBarbershopConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getBarbershopConfig(data.ownerId);
  if (existing) {
    return db.update(barbershopConfig).set(data).where(eq(barbershopConfig.ownerId, data.ownerId));
  }
  return db.insert(barbershopConfig).values(data);
}
