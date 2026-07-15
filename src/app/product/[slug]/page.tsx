import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductGallery from "@/components/ProductGallery";
import ProductInfo from "@/components/ProductInfo";
import RelatedProducts from "@/components/RelatedProducts";
import { GENDER_LABELS, breadcrumbCategoryFor } from "@/lib/products";
import { getProductBySlug, getRelatedProducts } from "@/lib/products-data";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: product.primaryImage ? { images: [product.primaryImage] } : undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const breadcrumbCategory = breadcrumbCategoryFor(product.gender);
  const categoryLabel = GENDER_LABELS[breadcrumbCategory];
  const relatedProducts = await getRelatedProducts(product, 4);

  return (
    <div className="px-4 pt-7 pb-18 sm:px-8 lg:px-12">
      <div className="text-[12.5px] text-muted mb-5.5">
        <Link href="/">Home</Link> /{" "}
        <Link href={`/catalog/${breadcrumbCategory}`}>{categoryLabel}</Link> / {product.name}
      </div>
      <div className="flex gap-11 flex-wrap justify-center">
        <ProductGallery product={product} />
        <ProductInfo product={product} />
      </div>
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
