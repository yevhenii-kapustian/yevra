import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/utils/stripe/client";
import { createAdminClient } from "@/utils/supabase/admin-client";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      // .eq("payment_status", "unpaid") doubles as the idempotency guard —
      // a redelivered webhook for an already-paid order just updates 0 rows.
      // "unpaid"/"paid" are the only pre-refund values the orders_payment_status_check
      // constraint allows — there's no "pending" state in this schema.
      const { data: paidOrder } = await admin
        .from("orders")
        .update({
          payment_status: "paid",
          payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
          payment_provider: "stripe",
        })
        .eq("id", orderId)
        .eq("payment_status", "unpaid")
        .select("user_id, order_items(variant_id)")
        .maybeSingle();

      // Server-side half of "purchased items leave the cart" — this covers
      // logged-in users' DB-backed cart immediately and reliably (no client
      // ever has to run for it to take effect). Guest/localStorage carts are
      // handled client-side instead, on the confirmation page, since a
      // webhook has no way to reach into a browser's storage.
      if (paidOrder?.user_id) {
        const variantIds = paidOrder.order_items.map((i) => i.variant_id).filter((v): v is string => v !== null);
        if (variantIds.length > 0) {
          await admin.from("cart_items").delete().eq("user_id", paidOrder.user_id).in("variant_id", variantIds);
        }
      }
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      // No "cancelled" payment_status exists (see constraint note above) — an
      // abandoned/expired checkout stays "unpaid" and is marked cancelled at
      // the fulfillment level instead, which does allow it.
      await admin
        .from("orders")
        .update({ fulfillment_status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("payment_status", "unpaid")
        .eq("fulfillment_status", "unfulfilled");
    }
  }

  return NextResponse.json({ received: true });
}
