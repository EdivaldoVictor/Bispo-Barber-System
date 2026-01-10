import { Express, raw } from "express";
import { handleStripeWebhook } from "../stripe-webhook";

/**
 * Setup Stripe webhook endpoint
 * This must be called BEFORE express.json() middleware
 */
export function setupStripeWebhook(app: Express) {
  // Register the webhook endpoint with raw body parser
  // This must come BEFORE express.json() to preserve the raw body for signature verification
  app.post("/api/stripe/webhook", raw({ type: "application/json" }), handleStripeWebhook);

  console.log("[Stripe] Webhook endpoint registered at /api/stripe/webhook");
}
