// Client-safe: types + pure helpers only. No Supabase/next-headers imports —
// this file is imported directly by client components (cart, product card,
// etc.), so anything server-only belongs in products-data.ts instead.

export type ProductOption = { name: string; values: string[] };

export type ProductVariant = {
  id: string;
  optionValues: Record<string, string>;
  variantLabel: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  imageUrl: string | null;
};

export type Gender = "men" | "women" | "kids" | "unisex";
export type ProductType = "apparel" | "accessories";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  gender: Gender;
  productType: ProductType;
  images: { src: string; isDefault: boolean }[];
  options: ProductOption[];
  variants: ProductVariant[]; // pre-filtered to enabled + available — never empty
  createdAt: string;
};

export type EnrichedProduct = Product & {
  priceLabel: string;
  minPriceCents: number;
  hasDiscount: boolean;
  discountPct: number;
  oldPriceLabel: string;
  primaryImage: string | null;
};

// "shop"/"accessories" drive the nav (see src/components/Header) — "kids"
// and "sale" stay valid, reachable categories (SaleBanner links to
// /catalog/sale and self-hides until real discounted items exist) without
// being advertised in the nav bar until there's real inventory behind them.
export type CategoryKey = "shop" | "accessories" | "kids" | "sale" | "new";
export type SortKey = "popular" | "price-asc" | "price-desc" | "newest";

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  shop: "Shop",
  accessories: "Accessories",
  kids: "Kids",
  sale: "Sale",
  new: "New Arrivals",
};

const LETTER_SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL", "5XL", "6XL"];

// Printify returns variants (and therefore size values) in whatever order
// they happen to sync in, not S->XL order. Known letter sizes sort by the
// canonical list above; numeric sizes (waist measurements, etc.) sort
// numerically; anything unrecognized falls back to alphabetical.
export function sortSizeValues(values: string[]): string[] {
  return values.slice().sort((a, b) => {
    const ai = LETTER_SIZE_ORDER.indexOf(a.toUpperCase());
    const bi = LETTER_SIZE_ORDER.indexOf(b.toUpperCase());
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;

    const an = Number(a);
    const bn = Number(b);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;

    return a.localeCompare(b);
  });
}

// Printify names the "size" option differently per blueprint — plain
// "Size"/"Sizes" for apparel and most accessories, but "Bag Size", "Hat
// sizes", etc. for others. Match by substring instead of an exact list so
// none of these fall through. "Phone Models" (the phone case's device
// picker) correctly does NOT match — it's not a size in any customer-facing
// sense, just happens to share Printify's internal "size" option type.
export function isSizeOptionName(name: string): boolean {
  return /size/i.test(name);
}

// Used whenever a product has zero images — deliberately neutral (no color
// hex exists in the real data, unlike the old static mock).
export const FALLBACK_IMAGE_BG =
  "repeating-linear-gradient(135deg, oklch(95% 0.005 60) 0 16px, oklch(91% 0.005 60) 16px 32px)";

export function isValidCategory(value: string): value is CategoryKey {
  return value in CATEGORY_LABELS;
}

export function breadcrumbCategoryFor(productType: ProductType): CategoryKey {
  return productType === "accessories" ? "accessories" : "shop";
}

export function formatCents(cents: number): string {
  return "$" + (cents / 100).toFixed(2).replace(/\.00$/, "");
}

// Single source of truth for shipping pricing — CartContext, CheckoutView,
// CheckoutForm, and the PDP's "Delivery & Returns" copy all derive from
// these instead of restating the numbers independently (they used to drift:
// the delivery picker said "Free"/"$12" as static strings that had no actual
// connection to what CartContext charged).
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
export const STANDARD_SHIPPING_COST_CENTS = 800;
export const EXPRESS_SHIPPING_COST_CENTS = 1200;

// Pure, sync — operates on an already-fetched array so CatalogView can
// filter/sort without another round trip to Supabase.
export function getCategoryFacets(products: EnrichedProduct[]) {
  const sizes = new Set<string>();
  for (const product of products) {
    for (const variant of product.variants) {
      for (const [name, value] of Object.entries(variant.optionValues)) {
        if (isSizeOptionName(name) && value) sizes.add(value);
      }
    }
  }
  return { sizes: sortSizeValues(Array.from(sizes)) };
}

export function filterAndSortProducts(
  products: EnrichedProduct[],
  opts: { sizes?: string[]; sort?: SortKey } = {}
): EnrichedProduct[] {
  const { sizes = [], sort = "popular" } = opts;

  let filtered = products;
  if (sizes.length) {
    filtered = filtered.filter((p) =>
      p.variants.some((v) =>
        Object.entries(v.optionValues).some(([name, value]) => isSizeOptionName(name) && sizes.includes(value))
      )
    );
  }

  if (sort === "price-asc") filtered = filtered.slice().sort((a, b) => a.minPriceCents - b.minPriceCents);
  else if (sort === "price-desc") filtered = filtered.slice().sort((a, b) => b.minPriceCents - a.minPriceCents);
  else if (sort === "newest")
    filtered = filtered.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return filtered;
}
