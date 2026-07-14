import { stripeBgFor, type RawProduct } from "@/lib/products";

type ProductGalleryProps = {
  product: RawProduct;
  selectedColorIdx: number;
  onSelectColor: (index: number) => void;
};

export default function ProductGallery({ product, selectedColorIdx, onSelectColor }: ProductGalleryProps) {
  const selectedColor = product.colors[selectedColorIdx] ?? product.colors[0];

  return (
    <div className="flex-1 min-w-70" style={{ flexBasis: "380px" }}>
      <div
        className="aspect-4/5 rounded flex items-center justify-center mb-3"
        style={{ background: stripeBgFor(selectedColor.hex) }}
      >
        <span className="font-mono text-xs tracking-wide text-black/55">PRODUCT PHOTO</span>
      </div>
      <div className="flex gap-2.5">
        {product.colors.map((color, i) => (
          <button
            key={color.name}
            type="button"
            onClick={() => onSelectColor(i)}
            className="w-16 h-20 rounded-[3px] flex-none border-2"
            style={{
              background: stripeBgFor(color.hex),
              borderColor: i === selectedColorIdx ? "var(--accent)" : "transparent",
            }}
          />
        ))}
      </div>
    </div>
  );
}
