import Link from "next/link";
import { notFound } from "next/navigation";
import ProductView from "./ProductView";
import RelatedProducts from "@/components/RelatedProducts";
import { GENDER_LABELS, getProductById, getRelatedProducts } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const categoryLabel = GENDER_LABELS[product.gender];
  const relatedProducts = getRelatedProducts(product, 4);

  return (
    <div className="px-4 pt-7 pb-18 sm:px-8 lg:px-12">
      <div className="text-[12.5px] text-muted mb-5.5">
        <Link href="/">Home</Link> / <Link href={`/catalog/${product.gender}`}>{categoryLabel}</Link> / {product.name}
      </div>
      <ProductView key={product.id} product={product} />
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
