import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `sample-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("chat router", () => {
  it("should start a new conversation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.startConversation();

    expect(result).toHaveProperty("conversationId");
    expect(typeof result.conversationId).toBe("number");
  });

  it("should get user conversations", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Start a conversation first
    await caller.chat.startConversation();

    // Get conversations
    const conversations = await caller.chat.getConversations();

    expect(Array.isArray(conversations)).toBe(true);
    expect(conversations.length).toBeGreaterThan(0);
  });

  it("should send a message", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Start a conversation
    const { conversationId } = await caller.chat.startConversation();

    // Send a message
    const result = await caller.chat.sendMessage({
      conversationId,
      content: "I want to book a haircut",
    });

    expect(result).toEqual({ success: true });
  });

  it("should get messages from a conversation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Start a conversation
    const { conversationId } = await caller.chat.startConversation();

    // Send a message
    await caller.chat.sendMessage({
      conversationId,
      content: "I want to book a haircut",
    });

    // Get messages
    const messages = await caller.chat.getMessages({ conversationId });

    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toBe("I want to book a haircut");
  });
});

describe("appointments router", () => {
  it("should create an appointment", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 7);

    const result = await caller.appointments.create({
      service: "Haircut",
      duration: 30,
      scheduledAt,
      barberName: "John",
      notes: "Regular haircut",
    });

    expect(result).toHaveProperty("appointmentId");
    expect(typeof result.appointmentId).toBe("number");
  });

  it("should list user appointments", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an appointment
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 7);

    await caller.appointments.create({
      service: "Haircut",
      duration: 30,
      scheduledAt,
    });

    // List appointments
    const appointments = await caller.appointments.list();

    expect(Array.isArray(appointments)).toBe(true);
    expect(appointments.length).toBeGreaterThan(0);
  });

  it("should update an appointment status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an appointment
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 7);

    const { appointmentId } = await caller.appointments.create({
      service: "Haircut",
      duration: 30,
      scheduledAt,
    });

    // Update appointment
    const result = await caller.appointments.update({
      appointmentId,
      status: "confirmed",
    });

    expect(result).toEqual({ success: true });
  });

  it("admin should list all appointments", async () => {
    const ctx = createAuthContext(1);
    ctx.user!.role = "admin";
    const caller = appRouter.createCaller(ctx);

    const appointments = await caller.appointments.listAll();

    expect(Array.isArray(appointments)).toBe(true);
  });

  it("non-admin should not list all appointments", async () => {
    const ctx = createAuthContext();
    ctx.user!.role = "user";
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.appointments.listAll();
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("training router", () => {
  it("admin should get training examples", async () => {
    const ctx = createAuthContext(1);
    ctx.user!.role = "admin";
    const caller = appRouter.createCaller(ctx);

    const examples = await caller.training.getExamples();

    expect(Array.isArray(examples)).toBe(true);
  });

  it("non-admin should not get training examples", async () => {
    const ctx = createAuthContext();
    ctx.user!.role = "user";
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.training.getExamples();
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("admin should create a training example", async () => {
    const ctx = createAuthContext(1);
    ctx.user!.role = "admin";
    const caller = appRouter.createCaller(ctx);

    const result = await caller.training.createExample({
      userMessage: "I want to book a haircut",
      assistantResponse: "Sure! When would you like to schedule your haircut?",
      category: "booking",
      quality: "excellent",
    });

    expect(result).toHaveProperty("exampleId");
    expect(typeof result.exampleId).toBe("number");
  });

  it("admin should update a training example", async () => {
    const ctx = createAuthContext(1);
    ctx.user!.role = "admin";
    const caller = appRouter.createCaller(ctx);

    // Create an example
    const { exampleId } = await caller.training.createExample({
      userMessage: "I want to book a haircut",
      assistantResponse: "Sure! When would you like to schedule your haircut?",
      category: "booking",
      quality: "good",
    });

    // Update example
    const result = await caller.training.updateExample({
      exampleId,
      quality: "excellent",
      active: true,
    });

    expect(result).toEqual({ success: true });
  });
});
