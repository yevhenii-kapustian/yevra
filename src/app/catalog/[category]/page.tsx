import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogView from "./CatalogView";
import { GENDER_LABELS, isValidCategory } from "@/lib/products";

type CatalogPageProps = {
  params: Promise<{ category: string }>;
};

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { category: categoryParam } = await params;
  if (!isValidCategory(categoryParam)) notFound();

  const categoryLabel = GENDER_LABELS[categoryParam];

  return (
    <div className="px-4 pt-7 pb-16 sm:px-8 lg:px-12">
      <div className="text-[12.5px] text-muted mb-1.5">
        <Link href="/">Home</Link> / {categoryLabel}
      </div>
      <h1 className="text-[28px] font-extrabold mb-5">{categoryLabel}</h1>
      <CatalogView category={categoryParam} />
    </div>
  );
}
