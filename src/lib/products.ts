export type ColorOption = { name: string; hex: string };

export type Gender = "men" | "women" | "kids";

export type CategoryKey = Gender | "sale" | "new";

export type RawProduct = {
  id: string;
  name: string;
  brand: string;
  gender: Gender;
  price: number;
  oldPrice?: number;
  isNew?: boolean;
  colors: ColorOption[];
  sizes: string[];
};

export type EnrichedProduct = RawProduct & {
  hasDiscount: boolean;
  discountPct: number;
  priceLabel: string;
  oldPriceLabel: string;
  stripeBg: string;
};

export type SortKey = "popular" | "price-asc" | "price-desc" | "newest";

const BRANDS = [
  "NORDCLIFF",
  "HAVEN & CO",
  "REDWOOD SUPPLY",
  "STONE HARBOR",
  "WOLF & PINE",
  "URBAN FIELD",
  "ALTITUDE",
  "GREY ANCHOR",
];

const COLOR_POOL: ColorOption[] = [
  { name: "Black", hex: "#2b2b2b" },
  { name: "Stone", hex: "#cfc6b8" },
  { name: "Olive", hex: "#6b7052" },
  { name: "Navy", hex: "#33445c" },
  { name: "Rust", hex: "#b5613f" },
  { name: "White", hex: "#f2efe9" },
  { name: "Charcoal", hex: "#4a4a4a" },
  { name: "Camel", hex: "#b08d57" },
];

const LETTER_SIZES = ["S", "M", "L", "XL", "XXL"];
const WAIST_SIZES = ["28", "30", "32", "34", "36"];

function isWaistItem(name: string) {
  return /jean|trouser|pant|jogger|short/i.test(name);
}

type RawProductSeed = Omit<RawProduct, "colors" | "sizes">;

const RAW_PRODUCT_SEEDS: RawProductSeed[] = [
  { id: "p1", name: "Essential Crewneck Tee", brand: BRANDS[1], gender: "men", price: 32, oldPrice: 40, isNew: true },
  { id: "p2", name: "Oxford Button-Down Shirt", brand: BRANDS[0], gender: "men", price: 58, isNew: true },
  { id: "p3", name: "Slim Straight Jeans", brand: BRANDS[2], gender: "men", price: 74, oldPrice: 95 },
  { id: "p4", name: "Waxed Field Jacket", brand: BRANDS[3], gender: "men", price: 148 },
  { id: "p5", name: "Merino Crewneck Sweater", brand: BRANDS[4], gender: "men", price: 89, isNew: true },
  { id: "p6", name: "Cargo Utility Shorts", brand: BRANDS[5], gender: "men", price: 46 },
  { id: "p7", name: "Linen Short-Sleeve Shirt", brand: BRANDS[1], gender: "men", price: 54 },
  { id: "p8", name: "Quilted Bomber Jacket", brand: BRANDS[6], gender: "men", price: 132, oldPrice: 165 },
  { id: "p9", name: "Relaxed Fit Chino Pants", brand: BRANDS[0], gender: "men", price: 68 },
  { id: "p10", name: "Ribbed Knit Polo", brand: BRANDS[7], gender: "men", price: 44, isNew: true },
  { id: "p11", name: "Tailored Wide-Leg Trousers", brand: BRANDS[1], gender: "women", price: 72 },
  { id: "p12", name: "Cropped Denim Jacket", brand: BRANDS[2], gender: "women", price: 86, oldPrice: 110 },
  { id: "p13", name: "Silk-Blend Wrap Blouse", brand: BRANDS[0], gender: "women", price: 64 },
  { id: "p14", name: "Ribbed Knit Midi Dress", brand: BRANDS[7], gender: "women", price: 58 },
  { id: "p15", name: "Graphic Print Tee", brand: BRANDS[5], gender: "kids", price: 22 },
  { id: "p16", name: "Fleece Zip Hoodie", brand: BRANDS[4], gender: "kids", price: 38, oldPrice: 48 },
];

export const RAW_PRODUCTS: RawProduct[] = RAW_PRODUCT_SEEDS.map((p, i) => ({
  ...p,
  colors: [COLOR_POOL[i % COLOR_POOL.length], COLOR_POOL[(i + 3) % COLOR_POOL.length], COLOR_POOL[(i + 5) % COLOR_POOL.length]],
  sizes: isWaistItem(p.name) ? WAIST_SIZES : LETTER_SIZES,
}));

export const GENDER_LABELS: Record<CategoryKey, string> = {
  men: "Men",
  women: "Women",
  kids: "Kids",
  sale: "Sale",
  new: "New Arrivals",
};

export function stripeBgFor(hex: string) {
  return `repeating-linear-gradient(135deg, color-mix(in srgb, ${hex} 22%, white) 0 16px, color-mix(in srgb, ${hex} 11%, white) 16px 32px)`;
}

export function enrichProduct(p: RawProduct): EnrichedProduct {
  const hasDiscount = !!p.oldPrice;
  const discountPct = hasDiscount ? Math.round((1 - p.price / p.oldPrice!) * 100) : 0;
  return {
    ...p,
    hasDiscount,
    discountPct,
    priceLabel: "$" + p.price,
    oldPriceLabel: hasDiscount ? "$" + p.oldPrice : "",
    stripeBg: stripeBgFor(p.colors[0].hex),
  };
}

export function getProductById(id: string): RawProduct | undefined {
  return RAW_PRODUCTS.find((p) => p.id === id);
}

export function getFeaturedProducts(count = 4): EnrichedProduct[] {
  return RAW_PRODUCTS.slice(0, count).map(enrichProduct);
}

function matchesCategory(p: RawProduct, category: CategoryKey) {
  if (category === "sale") return !!p.oldPrice;
  if (category === "new") return !!p.isNew;
  return p.gender === category;
}

export function getCategoryFacets(category: CategoryKey) {
  const inCategory = RAW_PRODUCTS.filter((p) => matchesCategory(p, category));
  return {
    brands: Array.from(new Set(inCategory.map((p) => p.brand))),
    sizes: Array.from(new Set(inCategory.flatMap((p) => p.sizes))),
  };
}

export function getProductsByCategory(
  category: CategoryKey,
  opts: { brands?: string[]; sizes?: string[]; sort?: SortKey } = {}
): EnrichedProduct[] {
  const { brands = [], sizes = [], sort = "popular" } = opts;
  let filtered = RAW_PRODUCTS.filter((p) => matchesCategory(p, category));
  if (brands.length) filtered = filtered.filter((p) => brands.includes(p.brand));
  if (sizes.length) filtered = filtered.filter((p) => p.sizes.some((sz) => sizes.includes(sz)));

  if (sort === "price-asc") filtered = filtered.slice().sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") filtered = filtered.slice().sort((a, b) => b.price - a.price);
  else if (sort === "newest") filtered = filtered.slice().sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

  return filtered.map(enrichProduct);
}

export function getRelatedProducts(product: RawProduct, count = 4): EnrichedProduct[] {
  return RAW_PRODUCTS.filter((p) => p.gender === product.gender && p.id !== product.id)
    .slice(0, count)
    .map(enrichProduct);
}

export function isValidCategory(value: string): value is CategoryKey {
  return value in GENDER_LABELS;
}
