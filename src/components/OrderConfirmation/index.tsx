"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { formatCents } from "@/lib/products";
import type { ShippingAddress } from "@/lib/checkout-types";
import { useCart } from "@/context/CartContext";

type ConfirmationOrder = {
  order_number: string;
  email: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  shipping_address: ShippingAddress;
  order_items: {
    id: string;
    title: string;
    variant_title: string | null;
    quantity: number;
    line_total_cents: number;
  }[];
};

type OrderConfirmationProps = {
  order: ConfirmationOrder;
  purchasedVariantIds: string[];
  accountPrompt?: ReactNode;
};

export default function OrderConfirmation({ order, purchasedVariantIds, accountPrompt }: OrderConfirmationProps) {
  const address = order.shipping_address;
  const { isHydrated, cartLines, removeLine } = useCart();
  const clearedPurchase = useRef(false);

  // Removes exactly the just-purchased lines from the cart, not a blanket
  // clearCart() — so anything added elsewhere (another tab/device) in the
  // meantime survives. Waits for isHydrated before touching anything: firing
  // immediately on mount would race CartContext's own async hydration
  // effect, which loads the pre-purchase cart from localStorage/Supabase and
  // would silently overwrite an early removal with stale data once it
  // resolves. (Logged-in users' DB cart is also cleared server-side, from
  // the Stripe webhook — this client-side pass is what covers guests, whose
  // cart lives in localStorage a webhook can't reach.)
  useEffect(() => {
    if (!isHydrated || clearedPurchase.current || purchasedVariantIds.length === 0) return;
    clearedPurchase.current = true;
    for (const variantId of purchasedVariantIds) {
      if (cartLines.some((l) => l.variantId === variantId)) removeLine(variantId);
    }
  }, [isHydrated, cartLines, purchasedVariantIds, removeLine]);

  return (
    <div className="text-center py-20 max-w-105 mx-auto">
      <div className="w-16 h-16 rounded-full bg-accent text-white text-3xl flex items-center justify-center mx-auto mb-6">
        ✓
      </div>
      <div className="text-2xl font-extrabold mb-2.5">Order placed!</div>
      <div className="text-sm text-muted mb-6">
        Order #{order.order_number} — a confirmation has been sent to {order.email}.
      </div>

      <div className="text-left flex flex-col gap-2.5 mb-5">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between text-[13px]">
            <span>
              {item.title}
              {item.variant_title ? ` · ${item.variant_title}` : ""} × {item.quantity}
            </span>
            <span className="font-semibold">{formatCents(item.line_total_cents)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-[13px] mb-1.5 text-muted">
        <span>Subtotal</span>
        <span>{formatCents(order.subtotal_cents)}</span>
      </div>
      <div className="flex justify-between text-[13px] mb-3.5 text-muted">
        <span>Shipping</span>
        <span>{order.shipping_cents === 0 ? "Free" : formatCents(order.shipping_cents)}</span>
      </div>
      <div className="flex justify-between text-base font-extrabold pt-3.5 border-t border-line mb-6">
        <span>Total</span>
        <span>{formatCents(order.total_cents)}</span>
      </div>

      <div className="text-left border-t border-line pt-5">
        <div className="text-[12.5px] font-bold mb-1.5">Shipping to</div>
        <div className="text-[13px] text-muted leading-relaxed">
          {address.firstName} {address.lastName}
          <br />
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
          <br />
          {address.city}, {address.state} {address.postalCode}
          <br />
          {address.country}
        </div>
      </div>

      {accountPrompt}

      <Link href="/" className="inline-block mt-7 bg-ink text-white px-6.5 py-3.25 text-sm font-bold rounded-sm">
        Continue Shopping
      </Link>
    </div>
  );
}
