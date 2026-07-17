"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { FALLBACK_IMAGE_BG } from "@/lib/products";

export default function CartList() {
  const { cartLines, incLine, decLine, removeLine } = useCart();

  if (cartLines.length === 0) {
    return (
      <div className="w-full text-center py-20">
        <div className="text-[15px] text-muted mb-5">Your cart is empty.</div>
        <Link href="/catalog/men" className="inline-block bg-ink text-white px-6.5 py-3.25 text-sm font-bold rounded-sm">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-70 flex flex-col gap-5" style={{ flexBasis: "480px" }}>
      {cartLines.map((line) => (
        <div key={line.variantId} className="flex gap-4 pb-5 border-b border-line">
          <div className="relative w-22 h-27.5 flex-none rounded-[3px] overflow-hidden" style={{ background: FALLBACK_IMAGE_BG }}>
            {line.snapshot.imageUrl && (
              <Image src={line.snapshot.imageUrl} alt="" fill className="object-cover" sizes="88px" quality={95} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14.5px] font-semibold my-0.5 mb-1">{line.snapshot.productName}</div>
            <div className="text-[12.5px] text-muted mb-2.5">{line.snapshot.variantLabel}</div>
            <div className="flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center border-[1.5px] border-line rounded-sm">
                <button
                  type="button"
                  onClick={() => decLine(line.variantId)}
                  className="w-7.5 h-7.5 flex items-center justify-center"
                >
                  −
                </button>
                <div className="w-8 text-center text-[13px] font-semibold">{line.qty}</div>
                <button
                  type="button"
                  onClick={() => incLine(line.variantId)}
                  className="w-7.5 h-7.5 flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <span className="text-[14.5px] font-bold">{line.lineTotalLabel}</span>
              <button
                type="button"
                onClick={() => removeLine(line.variantId)}
                className="text-[12.5px] text-muted underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
