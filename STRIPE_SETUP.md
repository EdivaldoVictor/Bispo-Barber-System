# Stripe Integration Setup Guide

This guide explains how to configure Stripe for the Barber AI Scheduler project.

## Overview

The project uses Stripe for payment processing. Customers must pay before confirming their appointments with the following pricing:

- **Haircut (Corte de Cabelo)**: $25.00
- **Hair & Eyebrow (Cabelo e Sobrancelha)**: $30.00
- **Full Service (Serviço Completo)**: $40.00

## Setup Instructions

### 1. Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign in or create an account
3. Navigate to **Developers** → **API Keys**
4. Copy your:
   - **Secret Key** (starts with `sk_`)
   - **Publishable Key** (starts with `pk_`)

### 2. Configure Environment Variables

Add your Stripe keys to your project's environment variables:

```bash
STRIPE_SECRET_KEY=sk_your_secret_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Set Up Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://seu-dominio.com/api/stripe/webhook`
4. Select the following events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing Secret** and add it to `STRIPE_WEBHOOK_SECRET`

### 4. Testing

#### Test Card Numbers

Use these card numbers in test mode:

- **Successful Payment**: `4242 4242 4242 4242`
- **Failed Payment**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

For any expiry date in the future and any 3-digit CVC.

#### Test Webhook Events

You can manually trigger webhook events from the Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Select your endpoint
3. Click **Send test webhook**
4. Choose the event type and send

### 5. Going Live

When you're ready to accept real payments:

1. Complete Stripe's KYC verification
2. Get your live API keys from the Stripe Dashboard
3. Update your environment variables with live keys
4. Update your webhook URL to your production domain
5. Test thoroughly with real transactions (use a small amount)

## How It Works

### Payment Flow

1. User creates an appointment
2. User clicks "Confirm Appointment"
3. System creates a Stripe Checkout Session
4. User is redirected to Stripe's hosted checkout page
5. User enters payment information
6. Upon successful payment, Stripe sends a webhook event
7. Our server updates the appointment status to "confirmed"
8. User is redirected back to the app

### Webhook Events

The `/api/stripe/webhook` endpoint handles:

- **checkout.session.completed**: Updates appointment payment status
- **payment_intent.succeeded**: Confirms payment
- **payment_intent.payment_failed**: Marks payment as failed
- **charge.refunded**: Cancels appointment and refunds payment

## Database Schema

Stripe-related fields in the database:

### Users Table
- `stripeCustomerId`: Stripe customer ID

### Appointments Table
- `paymentStatus`: "pending" | "completed" | "failed" | "refunded"
- `stripePaymentIntentId`: Stripe Payment Intent ID
- `stripeCheckoutSessionId`: Stripe Checkout Session ID
- `priceInCents`: Price in cents

## API Endpoints

### Create Checkout Session

**POST** `/api/trpc/stripe.createCheckoutSession`

```json
{
  "appointmentId": 1,
  "serviceId": "haircut"
}
```

### Get Payment Status

**POST** `/api/trpc/stripe.getPaymentStatus`

```json
{
  "appointmentId": 1
}
```

### Get Payment History

**POST** `/api/trpc/stripe.getPaymentHistory`

## Support

For issues with Stripe integration, check [Stripe Documentation](https://stripe.com/docs)
