import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getFeaturedProducts } from "@/lib/products";

export default function TrendingProducts() {
  const products = getFeaturedProducts(4);

  return (
    <section className="px-4 sm:px-8 lg:px-12 pb-14">
      <div className="flex items-baseline justify-between gap-3 mb-6 flex-wrap">
        <h2 className="text-[22px] font-extrabold">Trending Now</h2>
        <Link href="/catalog/men" className="text-[13px] font-bold text-accent">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5.5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
