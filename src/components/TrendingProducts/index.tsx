import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getFeaturedProducts } from "@/lib/products-data";

export default async function TrendingProducts() {
  const products = await getFeaturedProducts(4);

  return (
    <section className="px-4 sm:px-8 lg:px-12 pb-14">
      <div className="flex items-baseline justify-between gap-3 mb-6 flex-wrap">
        <h2 className="text-[22px] font-extrabold">Trending Now</h2>
        <Link href="/catalog/new" className="text-[13px] font-bold text-accent">
          View all
        </Link>
      </div>
      {/* Explicit fr-sized columns (not auto-fill) so the row always fills
          the full width regardless of item count — auto-fill reserves empty
          phantom tracks instead of letting real items stretch into the gap.
          The uneven 3fr/2fr widths give the first card a featured feel. */}
      <div className="grid grid-cols-2 auto-rows-60 sm:auto-rows-75 lg:grid-cols-[3fr_2fr_2fr_2fr] lg:auto-rows-105 gap-5.5">
        {products.map((product, i) => (
          <div key={product.id} className={i === 0 ? "col-span-2 sm:col-span-1" : undefined}>
            <ProductCard product={product} imageClassName="flex-1" />
          </div>
        ))}
      </div>
    </section>
  );
}
