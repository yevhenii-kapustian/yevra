import Stripe from "stripe";

// Lazy singleton — mirrors src/utils/supabase/browser-client.ts. Must not
// construct at module load time: Next's build-time page-data collection
// imports route modules without .env.local secrets present, and eagerly
// calling `new Stripe(...)` there throws.
let client: Stripe | undefined;

export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-06-24.dahlia",
    });
  }
  return client;
}
