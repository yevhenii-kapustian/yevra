"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatCents } from "@/lib/products";

export default function CartSummary() {
  const { cartLines, subtotalCents, shippingCents, totalCents } = useCart();

  if (cartLines.length === 0) return null;

  return (
    <div className="flex-0 min-w-70 bg-surface rounded p-6" style={{ flexBasis: "320px" }}>
      <div className="text-[15px] font-extrabold mb-4.5">Order Summary</div>
      <div className="flex justify-between text-[13.5px] mb-2.5 text-[oklch(40%_0.02_50)]">
        <span>Subtotal</span>
        <span>{formatCents(subtotalCents)}</span>
      </div>
      <div className="flex justify-between text-[13.5px] mb-3.5 text-[oklch(40%_0.02_50)]">
        <span>Shipping</span>
        <span>{shippingCents === 0 ? "Free" : formatCents(shippingCents)}</span>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          placeholder="Promo code"
          className="flex-1 min-w-0 border border-line px-3 py-2.5 text-[13px] rounded-sm"
        />
        <button type="button" className="border-[1.5px] border-ink bg-transparent px-4 text-[13px] font-bold rounded-sm">
          Apply
        </button>
      </div>
      <div className="flex justify-between text-base font-extrabold pt-3.5 border-t border-line mb-5">
        <span>Total</span>
        <span>{formatCents(totalCents)}</span>
      </div>
      <Link
        href="/checkout"
        className="block w-full text-center bg-ink text-white py-3.75 text-sm font-bold rounded-sm hover:bg-accent"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
