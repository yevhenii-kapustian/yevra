import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin-client";
import type { Database, Json } from "@/utils/supabase/database.types";
import { getShopProducts, type PrintifyImage, type PrintifyOption, type PrintifyProduct } from "./client";

type AdminClient = SupabaseClient<Database>;

export type SyncSummary = {
  createdProducts: number;
  updatedProducts: number;
  createdVariants: number;
  updatedVariants: number;
  productIds: string[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(supabase: AdminClient, base: string): Promise<string> {
  const cleanBase = base || "product";
  let candidate = cleanBase;
  let suffix = 1;

  while (true) {
    const { data } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${cleanBase}-${suffix}`;
  }
}

function resolveOptionValues(options: PrintifyOption[], selectedValueIds: number[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const option of options) {
    const match = option.values.find((v) => selectedValueIds.includes(v.id));
    if (match) result[option.name] = match.title;
  }
  return result;
}

function pickVariantImage(images: PrintifyImage[], variantId: number): string | null {
  const variantImage = images.find((img) => img.variant_ids.includes(variantId));
  if (variantImage) return variantImage.src;
  const defaultImage = images.find((img) => img.is_default);
  return defaultImage?.src ?? images[0]?.src ?? null;
}

async function upsertProduct(
  supabase: AdminClient,
  shopId: string,
  product: PrintifyProduct
): Promise<{ id: string; created: boolean }> {
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("printify_product_id", product.id)
    .maybeSingle();

  const syncedFields = {
    title: product.title,
    description: product.description,
    options: product.options as unknown as Json,
    images: product.images as unknown as Json,
    printify_created_at: product.created_at,
    printify_synced_at: new Date().toISOString(),
    printify_raw: product as unknown as Json,
  };

  if (existing) {
    const { error } = await supabase.from("products").update(syncedFields).eq("id", existing.id);
    if (error) throw new Error(`Failed to update product ${product.id}: ${error.message}`);
    return { id: existing.id, created: false };
  }

  const slug = await uniqueSlug(supabase, slugify(product.title));
  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      ...syncedFields,
      printify_product_id: product.id,
      printify_shop_id: shopId,
      slug,
      gender: "unisex",
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(`Failed to insert product ${product.id}: ${error?.message}`);
  return { id: inserted.id, created: true };
}

async function upsertVariant(
  supabase: AdminClient,
  productId: string,
  product: PrintifyProduct,
  variant: PrintifyProduct["variants"][number]
): Promise<boolean> {
  const optionValues = resolveOptionValues(product.options, variant.options);
  const imageUrl = pickVariantImage(product.images, variant.id);

  const syncedFields = {
    sku: variant.sku,
    title: variant.title,
    option_values: optionValues as unknown as Json,
    price_cents: variant.price,
    is_enabled: variant.is_enabled,
    is_available: variant.is_available,
    image_url: imageUrl,
    printify_raw: variant as unknown as Json,
  };

  const { data: existing } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)
    .eq("printify_variant_id", variant.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("product_variants").update(syncedFields).eq("id", existing.id);
    if (error) throw new Error(`Failed to update variant ${variant.id}: ${error.message}`);
    return false;
  }

  const { error } = await supabase.from("product_variants").insert({
    ...syncedFields,
    product_id: productId,
    printify_variant_id: variant.id,
  });
  if (error) throw new Error(`Failed to insert variant ${variant.id}: ${error.message}`);
  return true;
}

export async function syncPrintifyProducts(): Promise<SyncSummary> {
  const shopId = process.env.PRINTIFY_SHOP_ID!;
  const token = process.env.PRINTIFY_API_TOKEN!;
  const supabase = createAdminClient();

  const printifyProducts = await getShopProducts(shopId, token);

  const summary: SyncSummary = {
    createdProducts: 0,
    updatedProducts: 0,
    createdVariants: 0,
    updatedVariants: 0,
    productIds: [],
  };

  for (const product of printifyProducts) {
    const { id: productId, created } = await upsertProduct(supabase, shopId, product);
    summary.productIds.push(productId);
    if (created) summary.createdProducts += 1;
    else summary.updatedProducts += 1;

    for (const variant of product.variants) {
      const variantCreated = await upsertVariant(supabase, productId, product, variant);
      if (variantCreated) summary.createdVariants += 1;
      else summary.updatedVariants += 1;
    }
  }

  return summary;
}
