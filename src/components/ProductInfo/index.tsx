"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCents, FREE_SHIPPING_THRESHOLD_CENTS, type Product, type ProductVariant } from "@/lib/products";

type ProductInfoProps = {
  product: Product;
};

// Printify's own listing description (rich text from the product editor)
// already tends to bundle in a "Care instructions" section per product, so
// there's no separate generic care accordion here — it would just duplicate
// or contradict whatever's actually in the real description below.
//
// This copy is intentionally aligned with Printify's actual policy, not a
// generic "free returns" promise: everything is made to order, so Printify
// itself only covers a reprint/refund for damaged items or print errors
// within 30 days — never "wrong size" or "changed my mind". Promising more
// than that here means Yevra eats the cost, not Printify. See
// https://help.printify.com/hc/en-us/articles/4483630299025.
//
// The "10 business days" production estimate is pulled from Printify's
// catalog shipping API (GET /v1/catalog/blueprints/{id}/print_providers/{id}/shipping.json)
// for the actual blueprint/print-provider pairs this store's products use —
// every one of them currently reports a 10-day handling_time, not the
// shorter "2–7 business days" some Printify help articles quote generically.
const DELIVERY_RETURNS_CONTENT = `Free standard delivery on orders over ${formatCents(FREE_SHIPPING_THRESHOLD_CENTS)}. Each piece is made to order — production takes up to 10 business days before your order ships. Free reprint or refund for damaged items or print errors within 30 days of delivery. Sizing and change-of-mind returns aren't available since every piece is made specifically for you.`;
const FALLBACK_DESCRIPTION =
  "A wardrobe staple crafted from premium materials, designed for everyday comfort and a considered fit. Made to last, season after season.";

function findMatchingVariant(variants: ProductVariant[], selection: Record<string, string>): ProductVariant | null {
  return (
    variants.find((v) => Object.entries(selection).every(([name, value]) => v.optionValues[name] === value)) ?? null
  );
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const { addToCart, showToast } = useCart();
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [openSection, setOpenSection] = useState("description");

  const allOptionsSelected = product.options.every((option) => selection[option.name]);
  const selectedVariant = allOptionsSelected ? findMatchingVariant(product.variants, selection) : null;

  const cheapestPriceCents = Math.min(...product.variants.map((v) => v.priceCents));
  const displayPriceCents = selectedVariant?.priceCents ?? cheapestPriceCents;
  const hasDiscount = !!selectedVariant && selectedVariant.compareAtPriceCents != null;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addToCart(product.id, selectedVariant.id, qty, {
      productName: product.name,
      productSlug: product.slug,
      variantLabel: selectedVariant.variantLabel,
      unitPriceCents: selectedVariant.priceCents,
      imageUrl: selectedVariant.imageUrl ?? product.images[0]?.src ?? null,
    });
    showToast(`${product.name} added to cart`);
  };

  return (
    <div className="flex-1 min-w-70 max-w-115" style={{ flexBasis: "380px" }}>
      <h1 className="text-2xl font-extrabold leading-tight mb-2.5">{product.name}</h1>
      <div className="flex gap-2.5 items-baseline mb-5.5">
        <span className="text-xl font-bold">{formatCents(displayPriceCents)}</span>
        {hasDiscount && selectedVariant && (
          <>
            <span className="text-[15px] text-muted line-through">
              {formatCents(selectedVariant.compareAtPriceCents!)}
            </span>
            <span className="text-[12.5px] font-bold text-accent">
              -{Math.round((1 - selectedVariant.priceCents / selectedVariant.compareAtPriceCents!) * 100)}%
            </span>
          </>
        )}
      </div>

      {product.options.map((option) => (
        <div key={option.name} className="mb-5.5">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-[12.5px] font-bold">
              {option.name}
              {selection[option.name] ? `: ${selection[option.name]}` : ""}
            </div>
            {!selection[option.name] && <span className="text-xs text-accent">Please select {option.name.toLowerCase()}</span>}
          </div>
          <div className="flex flex-wrap gap-2.25">
            {option.values.map((value) => {
              const active = selection[option.name] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelection((s) => ({ ...s, [option.name]: value }))}
                  className="min-w-11.5 px-3 py-2.25 text-center rounded-sm border-[1.5px] text-[13px] font-semibold"
                  style={{
                    borderColor: active ? "var(--ink)" : "var(--line)",
                    background: active ? "var(--ink)" : "transparent",
                    color: active ? "#fff" : "var(--ink)",
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 mb-5">
        <div className="text-[12.5px] font-bold">Quantity</div>
        <div className="flex items-center border-[1.5px] border-line rounded-sm">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-8.5 h-8.5 flex items-center justify-center text-base"
          >
            −
          </button>
          <div className="w-9 text-center text-[13px] font-semibold">{qty}</div>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="w-8.5 h-8.5 flex items-center justify-center text-base"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!selectedVariant}
        className="w-full bg-ink text-white py-4 text-[14.5px] font-bold tracking-wide rounded-sm mb-7 hover:bg-accent disabled:opacity-50 disabled:hover:bg-ink"
      >
        Add to Cart — {formatCents(displayPriceCents * qty)}
      </button>

      <div className="border-t border-line">
        <button
          type="button"
          onClick={() => setOpenSection(openSection === "description" ? "" : "description")}
          className="w-full flex items-center justify-between py-3.5 text-[13.5px] font-bold"
        >
          <span>Description</span>
          <span>{openSection === "description" ? "−" : "+"}</span>
        </button>
        {openSection === "description" &&
          (product.description ? (
            // Trusted first-party content — this is the store owner's own
            // Printify listing copy, not arbitrary user input.
            <div
              className="pb-4 text-[13px] leading-relaxed text-[oklch(45%_0.02_50)] [&_p]:mb-2 last:[&_p]:mb-0"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : (
            <div className="pb-4 text-[13px] leading-relaxed text-[oklch(45%_0.02_50)]">{FALLBACK_DESCRIPTION}</div>
          ))}
      </div>

      <div className="border-t border-line">
        <button
          type="button"
          onClick={() => setOpenSection(openSection === "delivery" ? "" : "delivery")}
          className="w-full flex items-center justify-between py-3.5 text-[13.5px] font-bold"
        >
          <span>Delivery & Returns</span>
          <span>{openSection === "delivery" ? "−" : "+"}</span>
        </button>
        {openSection === "delivery" && (
          <div className="pb-4 text-[13px] leading-relaxed text-[oklch(45%_0.02_50)]">{DELIVERY_RETURNS_CONTENT}</div>
        )}
      </div>
    </div>
  );
}
