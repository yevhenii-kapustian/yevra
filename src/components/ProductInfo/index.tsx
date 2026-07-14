"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { enrichProduct, type RawProduct } from "@/lib/products";

type ProductInfoProps = {
  product: RawProduct;
  selectedColorIdx: number;
  onSelectColor: (index: number) => void;
};

const ACCORDIONS = [
  {
    key: "description",
    label: "Description",
    content:
      "A wardrobe staple crafted from premium materials, designed for everyday comfort and a considered fit. Made to last, season after season.",
  },
  {
    key: "delivery",
    label: "Delivery & Returns",
    content: "Free standard delivery on orders over $75. Free returns within 30 days of purchase.",
  },
  {
    key: "care",
    label: "Care Instructions",
    content: "Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed.",
  },
];

export default function ProductInfo({ product, selectedColorIdx, onSelectColor }: ProductInfoProps) {
  const { addToCart, showToast } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [openSection, setOpenSection] = useState("description");

  const enriched = enrichProduct(product);
  const selectedColor = product.colors[selectedColorIdx] ?? product.colors[0];

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addToCart(product.id, selectedSize, qty);
    showToast(`${product.name} added to cart`);
  };

  return (
    <div className="flex-1 min-w-70 max-w-115" style={{ flexBasis: "380px" }}>
      <div className="text-[11.5px] font-bold tracking-wide text-muted uppercase mb-1.5">{product.brand}</div>
      <h1 className="text-2xl font-extrabold leading-tight mb-2.5">{product.name}</h1>
      <div className="flex gap-2.5 items-baseline mb-5.5">
        <span className="text-xl font-bold">{enriched.priceLabel}</span>
        {enriched.hasDiscount && (
          <>
            <span className="text-[15px] text-muted line-through">{enriched.oldPriceLabel}</span>
            <span className="text-[12.5px] font-bold text-accent">-{enriched.discountPct}%</span>
          </>
        )}
      </div>

      <div className="mb-5.5">
        <div className="text-[12.5px] font-bold mb-2.5">Color: {selectedColor.name}</div>
        <div className="flex gap-2.5">
          {product.colors.map((color, i) => (
            <button
              key={color.name}
              type="button"
              onClick={() => onSelectColor(i)}
              className="w-7.5 h-7.5 rounded-full border-2"
              style={{
                background: color.hex,
                borderColor: i === selectedColorIdx ? "var(--accent)" : "transparent",
                boxShadow: "0 0 0 1px oklch(85% 0.01 50)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[12.5px] font-bold">Size</div>
        {!selectedSize && <span className="text-xs text-accent">Please select a size</span>}
      </div>
      <div className="flex flex-wrap gap-2.25 mb-6">
        {product.sizes.map((size) => {
          const active = selectedSize === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className="min-w-11.5 px-1.5 py-2.25 text-center rounded-sm border-[1.5px] text-[13px] font-semibold"
              style={{
                borderColor: active ? "var(--ink)" : "var(--line)",
                background: active ? "var(--ink)" : "transparent",
                color: active ? "#fff" : "var(--ink)",
              }}
            >
              {size}
            </button>
          );
        })}
      </div>

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
        className="w-full bg-ink text-white py-4 text-[14.5px] font-bold tracking-wide rounded-sm mb-7 hover:bg-accent"
      >
        Add to Cart — ${product.price * qty}
      </button>

      {ACCORDIONS.map((section) => {
        const open = openSection === section.key;
        return (
          <div key={section.key} className="border-t border-line">
            <button
              type="button"
              onClick={() => setOpenSection(open ? "" : section.key)}
              className="w-full flex items-center justify-between py-3.5 text-[13.5px] font-bold"
            >
              <span>{section.label}</span>
              <span>{open ? "−" : "+"}</span>
            </button>
            {open && <div className="pb-4 text-[13px] leading-relaxed text-[oklch(45%_0.02_50)]">{section.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
