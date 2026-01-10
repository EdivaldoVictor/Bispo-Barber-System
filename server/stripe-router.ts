import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import Stripe from "stripe";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { appointments, users } from "../drizzle/schema";
import { getServiceById } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const stripeRouter = router({
  /**
   * Create a checkout session for an appointment
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        serviceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the appointment
      const appointment = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, input.appointmentId))
        .limit(1);

      if (!appointment || appointment.length === 0) {
        throw new Error("Appointment not found");
      }

      const apt = appointment[0];

      // Verify the appointment belongs to the user
      if (apt.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Get the service
      const service = getServiceById(input.serviceId);
      if (!service) {
        throw new Error("Service not found");
      }

      // Get or create Stripe customer
      let stripeCustomerId = ctx.user.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email || undefined,
          name: ctx.user.name || undefined,
          metadata: {
            user_id: ctx.user.id.toString(),
          },
        });

        stripeCustomerId = customer.id;

        // Save the Stripe customer ID
        await db
          .update(users)
          .set({ stripeCustomerId })
          .where(eq(users.id, ctx.user.id));
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: service.currency,
              product_data: {
                name: service.name,
                description: service.description,
              },
              unit_amount: service.price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${ctx.req.headers.origin}/chat?payment=success&appointment=${input.appointmentId}`,
        cancel_url: `${ctx.req.headers.origin}/chat?payment=cancelled&appointment=${input.appointmentId}`,
        client_reference_id: input.appointmentId.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          appointment_id: input.appointmentId.toString(),
          service_id: input.serviceId,
        },
      });

      // Update appointment with checkout session ID and price
      await db
        .update(appointments)
        .set({
          stripeCheckoutSessionId: session.id,
          priceInCents: service.price,
        })
        .where(eq(appointments.id, input.appointmentId));

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    }),

  /**
   * Get payment status for an appointment
   */
  getPaymentStatus: protectedProcedure
    .input(z.object({ appointmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const appointment = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, input.appointmentId))
        .limit(1);

      if (!appointment || appointment.length === 0) {
        throw new Error("Appointment not found");
      }

      const apt = appointment[0];

      // Verify the appointment belongs to the user
      if (apt.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return {
        paymentStatus: apt.paymentStatus,
        appointmentStatus: apt.status,
        priceInCents: apt.priceInCents,
      };
    }),

  /**
   * Get payment history for user
   */
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userAppointments = await db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, ctx.user.id));

    return userAppointments
      .filter((apt) => apt.paymentStatus === "completed")
      .map((apt) => ({
        id: apt.id,
        service: apt.service,
        scheduledAt: apt.scheduledAt,
        priceInCents: apt.priceInCents,
        paymentStatus: apt.paymentStatus,
        createdAt: apt.createdAt,
      }));
  }),
});
