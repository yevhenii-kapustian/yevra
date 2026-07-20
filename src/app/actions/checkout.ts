"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server-client";
import { createAdminClient } from "@/utils/supabase/admin-client";
import { getVariantsForCheckout } from "@/lib/products-data";
import { FREE_SHIPPING_THRESHOLD_CENTS, STANDARD_SHIPPING_COST_CENTS, EXPRESS_SHIPPING_COST_CENTS } from "@/lib/products";
import type { ShippingAddress } from "@/lib/checkout-types";
import { getStripe } from "@/utils/stripe/client";
import { cartSchema, checkoutSchema } from "@/lib/validation/checkout";

export type CheckoutActionState = { error?: string } | undefined;

// Server Action backing the checkout form. Never trusts client-submitted
// prices/totals — re-derives everything from Supabase before creating the
// Stripe session. See src/app/actions/auth.ts for the same
// (prevState, formData) => useActionState shape this follows.
export async function startCheckout(
  _prevState: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  const fields = checkoutSchema.safeParse({
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    deliveryMethod: formData.get("deliveryMethod") === "express" ? "express" : "standard",
  });
  if (!fields.success) {
    return { error: fields.error.issues[0].message };
  }

  let cartLines: { variantId: string; qty: number }[];
  try {
    cartLines = cartSchema.parse(JSON.parse(String(formData.get("cart") ?? "")));
  } catch {
    return { error: "Your cart is empty." };
  }

  const { email, firstName, lastName, phone, line1, line2, city, state, postalCode, country, deliveryMethod } =
    fields.data;
  const shippingAddress: ShippingAddress = { firstName, lastName, phone, line1, line2, city, state, postalCode, country };

  const variantMap = await getVariantsForCheckout(cartLines.map((l) => l.variantId));
  if (cartLines.some((l) => !variantMap.has(l.variantId))) {
    return { error: "One or more items in your cart are no longer available. Please review your cart." };
  }

  const subtotalCents = cartLines.reduce((sum, line) => sum + variantMap.get(line.variantId)!.priceCents * line.qty, 0);
  const shippingCents =
    deliveryMethod === "express"
      ? EXPRESS_SHIPPING_COST_CENTS
      : subtotalCents === 0 || subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : STANDARD_SHIPPING_COST_CENTS;
  const totalCents = subtotalCents + shippingCents;

  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const admin = createAdminClient();
  let orderId: string;

  try {
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        email,
        shipping_address: shippingAddress,
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        tax_cents: 0,
        discount_cents: 0,
        total_cents: totalCents,
        currency: "usd",
        payment_status: "unpaid",
        payment_provider: "stripe",
        user_id: user?.id ?? null,
      })
      .select("id")
      .single();

    if (orderError || !order) throw orderError ?? new Error("Order insert returned no row");
    orderId = order.id;

    const { error: itemsError } = await admin.from("order_items").insert(
      cartLines.map((line) => {
        const variant = variantMap.get(line.variantId)!;
        return {
          order_id: order.id,
          product_id: variant.productId,
          variant_id: line.variantId,
          printify_variant_id: variant.printifyVariantId,
          title: variant.productTitle,
          variant_title: variant.variantLabel || null,
          image_url: variant.imageUrl,
          quantity: line.qty,
          unit_price_cents: variant.priceCents,
          line_total_cents: variant.priceCents * line.qty,
        };
      })
    );
    if (itemsError) throw itemsError;
  } catch (err) {
    console.error("[checkout] failed to create order", err);
    return { error: "Something went wrong placing your order. Please try again." };
  }

  const siteUrl = process.env.SITE_URL!;
  let sessionUrl: string;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        ...cartLines.map((line) => {
          const variant = variantMap.get(line.variantId)!;
          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: variant.variantLabel ? `${variant.productTitle} — ${variant.variantLabel}` : variant.productTitle,
                images: variant.imageUrl ? [variant.imageUrl] : undefined,
              },
              unit_amount: variant.priceCents,
            },
            quantity: line.qty,
          };
        }),
        ...(shippingCents > 0
          ? [
              {
                price_data: {
                  currency: "usd",
                  product_data: { name: "Shipping" },
                  unit_amount: shippingCents,
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      metadata: { order_id: orderId },
      success_url: `${siteUrl}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
    });

    if (!session.url) throw new Error("Stripe session has no url");
    sessionUrl = session.url;
  } catch (err) {
    console.error("[checkout] failed to create Stripe session", err);
    return { error: "Payment could not be started. Please try again." };
  }

  redirect(sessionUrl);
}
