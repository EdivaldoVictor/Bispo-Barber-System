import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { appointments, users } from "../drizzle/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Handle Stripe webhook events
 * This endpoint processes payment confirmations and updates appointment status
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    console.error("[Webhook] Missing stripe-signature header");
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error: any) {
    console.error("[Webhook] Signature verification failed:", error.message);
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Webhook] Checkout session completed: ${session.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  const appointmentId = parseInt(session.client_reference_id || "0");
  if (!appointmentId) {
    console.error("[Webhook] No appointment ID in session");
    return;
  }

  try {
    // Update appointment with payment info
    await db
      .update(appointments)
      .set({
        paymentStatus: "completed",
        stripeCheckoutSessionId: session.id,
        status: "confirmed",
      })
      .where(eq(appointments.id, appointmentId));

    console.log(`[Webhook] Appointment ${appointmentId} payment confirmed`);
  } catch (error) {
    console.error("[Webhook] Error updating appointment:", error);
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment intent succeeded: ${paymentIntent.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  const appointmentId = parseInt(paymentIntent.metadata?.appointment_id || "0");
  if (!appointmentId) {
    console.log("[Webhook] No appointment ID in payment intent metadata");
    return;
  }

  try {
    await db
      .update(appointments)
      .set({
        paymentStatus: "completed",
        stripePaymentIntentId: paymentIntent.id,
        status: "confirmed",
      })
      .where(eq(appointments.id, appointmentId));

    console.log(`[Webhook] Appointment ${appointmentId} payment confirmed via payment intent`);
  } catch (error) {
    console.error("[Webhook] Error updating appointment:", error);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment intent failed: ${paymentIntent.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  const appointmentId = parseInt(paymentIntent.metadata?.appointment_id || "0");
  if (!appointmentId) {
    console.log("[Webhook] No appointment ID in payment intent metadata");
    return;
  }

  try {
    await db
      .update(appointments)
      .set({
        paymentStatus: "failed",
        stripePaymentIntentId: paymentIntent.id,
      })
      .where(eq(appointments.id, appointmentId));

    console.log(`[Webhook] Appointment ${appointmentId} payment failed`);
  } catch (error) {
    console.error("[Webhook] Error updating appointment:", error);
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`[Webhook] Charge refunded: ${charge.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  const appointmentId = parseInt(charge.metadata?.appointment_id || "0");
  if (!appointmentId) {
    console.log("[Webhook] No appointment ID in charge metadata");
    return;
  }

  try {
    await db
      .update(appointments)
      .set({
        paymentStatus: "refunded",
        status: "cancelled",
      })
      .where(eq(appointments.id, appointmentId));

    console.log(`[Webhook] Appointment ${appointmentId} refunded and cancelled`);
  } catch (error) {
    console.error("[Webhook] Error updating appointment:", error);
  }
}
