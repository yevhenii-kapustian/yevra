"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSummary from "@/components/CheckoutSummary";
import { useCart } from "@/context/CartContext";
import { EXPRESS_SHIPPING_COST_CENTS } from "@/lib/products";
import { startCheckout } from "@/app/actions/checkout";

type DeliveryMethod = "standard" | "express";

export default function CheckoutView() {
  const { cartLines, shippingCents, isHydrated } = useCart();
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [state, formAction, pending] = useActionState(startCheckout, undefined);

  // cartLines starts empty on every mount until the async hydrate effect in
  // CartContext resolves — gate on isHydrated so a real, still-loading cart
  // doesn't get bounced back to /cart before it's had a chance to load.
  useEffect(() => {
    if (isHydrated && cartLines.length === 0) router.replace("/cart");
  }, [isHydrated, cartLines.length, router]);

  if (!isHydrated || cartLines.length === 0) return null;

  const shippingCostCents = deliveryMethod === "express" ? EXPRESS_SHIPPING_COST_CENTS : shippingCents;
  const cartPayload = JSON.stringify(cartLines.map((l) => ({ variantId: l.variantId, qty: l.qty })));

  return (
    <div>
      <h1 className="text-[28px] font-extrabold mb-6">Checkout</h1>
      <form action={formAction} className="flex gap-10 flex-wrap items-start">
        <input type="hidden" name="cart" value={cartPayload} />
        <input type="hidden" name="deliveryMethod" value={deliveryMethod} />
        <CheckoutForm
          deliveryMethod={deliveryMethod}
          onSelectDelivery={setDeliveryMethod}
          standardShippingCents={shippingCents}
          expressShippingCents={EXPRESS_SHIPPING_COST_CENTS}
        />
        <CheckoutSummary shippingCostCents={shippingCostCents} pending={pending} error={state?.error} />
      </form>
    </div>
  );
}
