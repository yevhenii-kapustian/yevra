import ProductCard from "@/components/ProductCard";
import type { EnrichedProduct } from "@/lib/products";

type RelatedProductsProps = {
  products: EnrichedProduct[];
};

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-xl font-extrabold mb-5.5">You May Also Like</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5.5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} showDiscountBadge={false} />
        ))}
      </div>
    </div>
  );
}
