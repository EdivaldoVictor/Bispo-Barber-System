import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import { BARBERSHOP_SERVICES, getServiceById, getServiceByName, getAllServices, formatPrice } from "./products";
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
    stripeCustomerId: null,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {
        origin: "http://localhost:3000",
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Products Configuration", () => {
  it("should have all services defined", () => {
    expect(BARBERSHOP_SERVICES).toHaveProperty("HAIRCUT");
    expect(BARBERSHOP_SERVICES).toHaveProperty("HAIR_AND_EYEBROW");
    expect(BARBERSHOP_SERVICES).toHaveProperty("FULL_SERVICE");
  });

  it("should have correct pricing", () => {
    expect(BARBERSHOP_SERVICES.HAIRCUT.price).toBe(2500); // $25.00
    expect(BARBERSHOP_SERVICES.HAIR_AND_EYEBROW.price).toBe(3000); // $30.00
    expect(BARBERSHOP_SERVICES.FULL_SERVICE.price).toBe(4000); // $40.00
  });

  it("should get service by ID", () => {
    const service = getServiceById("haircut");
    expect(service).toBeDefined();
    expect(service?.name).toBe("Corte de Cabelo");
  });

  it("should get service by name", () => {
    const service = getServiceByName("Corte de Cabelo");
    expect(service).toBeDefined();
    expect(service?.id).toBe("haircut");
  });

  it("should get all services", () => {
    const services = getAllServices();
    expect(services).toHaveLength(3);
  });

  it("should format price correctly", () => {
    expect(formatPrice(2500)).toBe("$25.00");
    expect(formatPrice(3000)).toBe("$30.00");
    expect(formatPrice(4000)).toBe("$40.00");
  });
});

describe("Stripe Router", () => {
  it("should get payment status for appointment", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an appointment first
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 7);

    const { appointmentId } = await caller.appointments.create({
      service: "haircut",
      duration: 30,
      scheduledAt,
    });

    // Get payment status
    const status = await caller.stripe.getPaymentStatus({
      appointmentId,
    });

    expect(status).toHaveProperty("paymentStatus");
    expect(status).toHaveProperty("appointmentStatus");
    expect(status.paymentStatus).toBe("pending");
    expect(status.appointmentStatus).toBe("pending");
  });

  it("should get payment history for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get payment history
    const history = await caller.stripe.getPaymentHistory();

    expect(Array.isArray(history)).toBe(true);
  });

  it("should not allow access to other user's payment status", async () => {
    const ctx1 = createAuthContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    // Create an appointment for user 1
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 7);

    const { appointmentId } = await caller1.appointments.create({
      service: "haircut",
      duration: 30,
      scheduledAt,
    });

    // Try to access with user 2
    const ctx2 = createAuthContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    try {
      await caller2.stripe.getPaymentStatus({ appointmentId });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toBe("Unauthorized");
    }
  });
});
