// Server-only: touches Supabase (via queries.ts -> server-client.ts ->
// next/headers). Never import this from a client component — import types
// and pure helpers from ./products instead.
import { getActiveProductRows, getProductRowBySlug, type ProductRow } from "@/utils/supabase/queries";
import { createClient } from "@/utils/supabase/server-client";
import {
  formatCents,
  isSizeOptionName,
  sortSizeValues,
  type CategoryKey,
  type EnrichedProduct,
  type Product,
  type ProductOption,
  type ProductVariant,
} from "./products";

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Printify stores the blueprint's *full* option catalog on the product row
// (e.g. all ~38 colors a Gildan crewneck could come in), regardless of which
// specific variants the merchant actually enabled. This gives the *names*
// and their declared order only — the selectable *values* are derived from
// the real sellable variants instead (see toProduct), so a shopper can never
// pick a color/size combination that doesn't actually exist for sale.
function normalizeOptionNames(json: ProductRow["options"]): string[] {
  if (!Array.isArray(json)) return [];
  return (json as Array<Record<string, unknown>>)
    .map((option) => String(option?.name ?? ""))
    .filter(Boolean);
}

function normalizeImages(json: ProductRow["images"]): { src: string; isDefault: boolean }[] {
  if (!Array.isArray(json)) return [];
  return (json as Array<Record<string, unknown>>)
    .map((image) => ({ src: String(image?.src ?? ""), isDefault: !!image?.is_default }))
    .filter((image) => image.src);
}

// The single place variant enablement is checked — everything downstream
// only ever sees sellable variants and never has to look at is_enabled/
// is_available again. A product with none left doesn't exist as far as the
// site is concerned (RLS only filters products.status, not variant flags).
function toProduct(row: ProductRow): Product | null {
  const optionOrder = normalizeOptionNames(row.options);

  const variants: ProductVariant[] = (row.product_variants ?? [])
    .filter((v) => v.is_enabled && v.is_available)
    .map((v) => {
      const optionValues = (v.option_values ?? {}) as Record<string, string>;
      return {
        id: v.id,
        optionValues,
        variantLabel: optionOrder.map((name) => optionValues[name]).filter(Boolean).join(" / "),
        priceCents: v.price_cents,
        compareAtPriceCents: v.compare_at_price_cents,
        imageUrl: v.image_url,
      };
    });

  if (variants.length === 0) return null;

  // Only offer values that at least one sellable variant actually has —
  // never the full blueprint catalog (see normalizeOptionNames above).
  // Printify blueprints declare option order inconsistently — some list
  // Color before Size, others the reverse. Force Size/Sizes first
  // regardless of source order, rather than showing whatever a given
  // blueprint happens to declare (Array.sort is stable, so anything else
  // keeps its original relative order).
  const options: ProductOption[] = optionOrder
    .map((name) => {
      const values = Array.from(new Set(variants.map((v) => v.optionValues[name]).filter((v): v is string => !!v)));
      return { name, values: isSizeOptionName(name) ? sortSizeValues(values) : values };
    })
    .filter((option) => option.values.length > 0)
    .sort((a, b) => Number(isSizeOptionName(b.name)) - Number(isSizeOptionName(a.name)));

  return {
    id: row.id,
    slug: row.slug,
    name: row.title,
    description: row.description,
    gender: row.gender as Product["gender"],
    productType: row.product_type as Product["productType"],
    images: normalizeImages(row.images),
    options,
    variants,
    createdAt: row.printify_created_at ?? row.created_at,
  };
}

function toEnrichedProduct(row: ProductRow): EnrichedProduct | null {
  const product = toProduct(row);
  if (!product) return null;

  const cheapest = product.variants.reduce((min, v) => (v.priceCents < min.priceCents ? v : min));
  const pricesDiffer = product.variants.some((v) => v.priceCents !== cheapest.priceCents);
  const hasDiscount = cheapest.compareAtPriceCents != null;
  const discountPct = hasDiscount
    ? Math.round((1 - cheapest.priceCents / cheapest.compareAtPriceCents!) * 100)
    : 0;
  const defaultImage = product.images.find((img) => img.isDefault) ?? product.images[0];

  return {
    ...product,
    priceLabel: (pricesDiffer ? "From " : "") + formatCents(cheapest.priceCents),
    minPriceCents: cheapest.priceCents,
    hasDiscount,
    discountPct,
    oldPriceLabel: hasDiscount ? formatCents(cheapest.compareAtPriceCents!) : "",
    primaryImage: defaultImage?.src ?? null,
  };
}

function isRecent(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < NEW_WINDOW_MS;
}

function matchesCategory(product: EnrichedProduct, category: CategoryKey): boolean {
  if (category === "sale") return product.variants.some((v) => v.compareAtPriceCents != null);
  if (category === "new") return isRecent(product.createdAt);
  if (category === "kids") return product.gender === "kids";
  if (category === "shop") return product.productType === "apparel";
  if (category === "accessories") return product.productType === "accessories";
  return false;
}

function enrichRows(rows: ProductRow[]): EnrichedProduct[] {
  return rows.map(toEnrichedProduct).filter((p): p is EnrichedProduct => p !== null);
}

export async function getFeaturedProducts(count = 4): Promise<EnrichedProduct[]> {
  const rows = await getActiveProductRows();
  return enrichRows(rows).slice(0, count);
}

export async function getProductsByCategory(category: CategoryKey): Promise<EnrichedProduct[]> {
  const rows = await getActiveProductRows();
  return enrichRows(rows).filter((p) => matchesCategory(p, category));
}

export async function getProductBySlug(slug: string): Promise<EnrichedProduct | null> {
  const row = await getProductRowBySlug(slug);
  if (!row) return null;
  return toEnrichedProduct(row);
}

export async function getRelatedProducts(product: EnrichedProduct, count = 4): Promise<EnrichedProduct[]> {
  const rows = await getActiveProductRows();
  return enrichRows(rows)
    .filter((p) => p.productType === product.productType && p.id !== product.id)
    .slice(0, count);
}

export type CheckoutVariant = {
  variantId: string;
  productId: string;
  printifyVariantId: number;
  productTitle: string;
  variantLabel: string;
  priceCents: number;
  imageUrl: string | null;
};

// Authoritative pricing lookup for checkout — never trust CartContext's
// snapshot unitPriceCents for an actual charge. Filters exactly like
// toProduct() (enabled + available + parent product active) so a variant
// that's since been disabled/hidden can't be checked out. Missing ids in the
// returned map mean the caller must fail the whole checkout, not proceed
// with a partial cart.
export async function getVariantsForCheckout(variantIds: string[]): Promise<Map<string, CheckoutVariant>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("*, products!inner(id, title, status)")
    .in("id", variantIds)
    .eq("is_enabled", true)
    .eq("is_available", true)
    .eq("products.status", "active");

  if (error) throw error;

  const map = new Map<string, CheckoutVariant>();
  for (const row of data) {
    map.set(row.id, {
      variantId: row.id,
      productId: row.products.id,
      printifyVariantId: row.printify_variant_id,
      productTitle: row.products.title,
      variantLabel: row.title ?? "",
      priceCents: row.price_cents,
      imageUrl: row.image_url,
    });
  }
  return map;
}
