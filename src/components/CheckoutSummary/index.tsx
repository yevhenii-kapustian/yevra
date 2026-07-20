"use client";

import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { FALLBACK_IMAGE_BG, formatCents } from "@/lib/products";

type CheckoutSummaryProps = {
  shippingCostCents: number;
  pending: boolean;
  error?: string;
};

export default function CheckoutSummary({ shippingCostCents, pending, error }: CheckoutSummaryProps) {
  const { cartLines, subtotalCents } = useCart();
  const totalCents = subtotalCents + shippingCostCents;

  return (
    <div className="flex-0 min-w-70 bg-surface rounded p-6" style={{ flexBasis: "320px" }}>
      <div className="text-[15px] font-extrabold mb-4.5">Order Summary</div>
      <div className="flex flex-col gap-3 mb-4">
        {cartLines.map((line) => (
          <div key={`${line.productId}-${line.variantId}`} className="flex gap-3 items-center">
            <div className="relative w-11 h-14 flex-none rounded-sm overflow-hidden" style={{ background: FALLBACK_IMAGE_BG }}>
              {line.snapshot.imageUrl && (
                <Image src={line.snapshot.imageUrl} alt="" fill className="object-cover" sizes="44px" quality={95} />
              )}
            </div>
            <div className="flex-1 min-w-0 text-[12.5px]">
              <div className="font-semibold">{line.snapshot.productName}</div>
              <div className="text-muted">
                {line.snapshot.variantLabel} · Qty {line.qty}
              </div>
            </div>
            <span className="text-[12.5px] font-bold">{line.lineTotalLabel}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[13.5px] mb-2.5 text-[oklch(40%_0.02_50)]">
        <span>Subtotal</span>
        <span>{formatCents(subtotalCents)}</span>
      </div>
      <div className="flex justify-between text-[13.5px] mb-3.5 text-[oklch(40%_0.02_50)]">
        <span>Shipping</span>
        <span>{shippingCostCents === 0 ? "Free" : formatCents(shippingCostCents)}</span>
      </div>
      <div className="flex justify-between text-base font-extrabold pt-3.5 border-t border-line mb-5">
        <span>Total</span>
        <span>{formatCents(totalCents)}</span>
      </div>
      {error && <p className="text-xs text-accent mb-3">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-white py-3.75 text-sm font-bold rounded-sm hover:bg-accent disabled:opacity-50"
      >
        {pending ? "Placing order…" : "Place Order"}
      </button>
    </div>
  );
}
