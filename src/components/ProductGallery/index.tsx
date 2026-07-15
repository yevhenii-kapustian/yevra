"use client";

import { useState } from "react";
import Image from "next/image";
import { FALLBACK_IMAGE_BG, type Product } from "@/lib/products";

type ProductGalleryProps = {
  product: Product;
};

// Deliberately independent of color/variant selection — Printify's image-to-
// variant mapping is sparse and not worth leaning on with a single-color
// product. Revisit (show only images matching the selected color) once a
// multi-color product actually exists.
export default function ProductGallery({ product }: ProductGalleryProps) {
  const defaultIndex = Math.max(
    product.images.findIndex((img) => img.isDefault),
    0
  );
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const selected = product.images[selectedIndex];

  return (
    <div className="flex-1 min-w-70 max-w-125" style={{ flexBasis: "380px" }}>
      <div className="relative aspect-square rounded overflow-hidden mb-3" style={{ background: FALLBACK_IMAGE_BG }}>
        {selected && (
          <Image
            src={selected.src}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 500px"
            quality={95}
            priority
          />
        )}
      </div>
      {product.images.length > 1 && (
        <div className="flex gap-2.5">
          {product.images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className="relative w-16 h-16 rounded-[3px] flex-none overflow-hidden border-2"
              style={{ borderColor: i === selectedIndex ? "var(--accent)" : "transparent" }}
            >
              <Image src={image.src} alt="" fill className="object-cover" sizes="64px" quality={95} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
