"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { FALLBACK_IMAGE_BG, type EnrichedProduct } from "@/lib/products";

type ProductCardProps = {
  product: EnrichedProduct;
  showDiscountBadge?: boolean;
  showQuickAdd?: boolean;
};

export default function ProductCard({ product, showDiscountBadge = true, showQuickAdd = false }: ProductCardProps) {
  const { quickAdd } = useCart();

  return (
    <div>
      <Link
        href={`/product/${product.slug}`}
        className="group block relative aspect-square rounded-[3px] overflow-hidden mb-2.5"
        style={{ background: FALLBACK_IMAGE_BG }}
      >
        {product.primaryImage && (
          <Image
            src={product.primaryImage}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
            quality={95}
          />
        )}
        {showDiscountBadge && product.hasDiscount && (
          <div className="absolute top-2.5 left-2.5 bg-accent text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm">
            -{product.discountPct}%
          </div>
        )}
        {showQuickAdd && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              quickAdd(product);
            }}
            className="absolute left-2 right-2 bottom-2 bg-ink/92 text-white text-center py-2.5 text-xs font-bold rounded-sm opacity-0 transition-opacity group-hover:opacity-100"
          >
            + Quick Add
          </button>
        )}
      </Link>
      <Link href={`/product/${product.slug}`} className="block text-[13.5px] font-semibold my-0.5 mb-1 leading-snug">
        {product.name}
      </Link>
      <div className="flex gap-2 items-baseline">
        <span className="text-sm font-bold">{product.priceLabel}</span>
        {showDiscountBadge && product.hasDiscount && (
          <span className="text-xs text-muted line-through">{product.oldPriceLabel}</span>
        )}
      </div>
    </div>
  );
}
