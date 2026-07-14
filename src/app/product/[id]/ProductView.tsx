"use client";

import { useState } from "react";
import ProductGallery from "@/components/ProductGallery";
import ProductInfo from "@/components/ProductInfo";
import type { RawProduct } from "@/lib/products";

type ProductViewProps = {
  product: RawProduct;
};

export default function ProductView({ product }: ProductViewProps) {
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  return (
    <div className="flex gap-11 flex-wrap">
      <ProductGallery product={product} selectedColorIdx={selectedColorIdx} onSelectColor={setSelectedColorIdx} />
      <ProductInfo product={product} selectedColorIdx={selectedColorIdx} onSelectColor={setSelectedColorIdx} />
    </div>
  );
}
