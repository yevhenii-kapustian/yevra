"use client";

import { useCart } from "@/context/CartContext";
import { stripeBgFor } from "@/lib/products";

type CheckoutSummaryProps = {
  shippingCost: number;
  onPlaceOrder: () => void;
};

export default function CheckoutSummary({ shippingCost, onPlaceOrder }: CheckoutSummaryProps) {
  const { cartLines, subtotal } = useCart();
  const total = subtotal + shippingCost;

  return (
    <div className="flex-0 min-w-70 bg-surface rounded p-6" style={{ flexBasis: "320px" }}>
      <div className="text-[15px] font-extrabold mb-4.5">Order Summary</div>
      <div className="flex flex-col gap-3 mb-4">
        {cartLines.map((line) => (
          <div key={`${line.productId}-${line.size}`} className="flex gap-3 items-center">
            <div
              className="w-11 h-14 flex-none rounded-sm"
              style={{ background: stripeBgFor(line.product.colors[0].hex) }}
            />
            <div className="flex-1 min-w-0 text-[12.5px]">
              <div className="font-semibold">{line.product.name}</div>
              <div className="text-muted">
                Size {line.size} · Qty {line.qty}
              </div>
            </div>
            <span className="text-[12.5px] font-bold">{line.lineTotalLabel}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[13.5px] mb-2.5 text-[oklch(40%_0.02_50)]">
        <span>Subtotal</span>
        <span>${subtotal}</span>
      </div>
      <div className="flex justify-between text-[13.5px] mb-3.5 text-[oklch(40%_0.02_50)]">
        <span>Shipping</span>
        <span>{shippingCost === 0 ? "Free" : `$${shippingCost}`}</span>
      </div>
      <div className="flex justify-between text-base font-extrabold pt-3.5 border-t border-line mb-5">
        <span>Total</span>
        <span>${total}</span>
      </div>
      <button
        type="button"
        onClick={onPlaceOrder}
        className="w-full bg-ink text-white py-3.75 text-sm font-bold rounded-sm hover:bg-accent"
      >
        Place Order
      </button>
    </div>
  );
}
