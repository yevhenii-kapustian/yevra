// Client-safe: touches Supabase via the browser (anon key, RLS-respecting)
// client only — never next/headers. Backs the logged-in-user cart tier;
// guests use cart-storage.ts instead.
import { createClient } from "@/utils/supabase/browser-client";
import type { CartLine, CartLineSnapshot } from "@/context/CartContext";

type CartPair = { productId: string; variantId: string; qty: number };

// Always re-derives name/price/image from live product_variants + products
// data — never trusts a stored snapshot, same principle as
// getVariantsForCheckout in src/lib/products-data.ts. Anything that's no
// longer purchasable (disabled/unavailable/inactive parent) is dropped; the
// caller decides whether to toast about it via the returned droppedCount.
export async function hydrateFreshCartLines(pairs: CartPair[]): Promise<{ lines: CartLine[]; droppedCount: number }> {
  if (pairs.length === 0) return { lines: [], droppedCount: 0 };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, product_id, title, price_cents, image_url, products!inner(slug, title, status, images)")
    .in(
      "id",
      pairs.map((p) => p.variantId)
    )
    .eq("is_enabled", true)
    .eq("is_available", true)
    .eq("products.status", "active");

  if (error) throw error;

  const byVariant = new Map(data.map((row) => [row.id, row]));
  const lines: CartLine[] = [];

  for (const pair of pairs) {
    const row = byVariant.get(pair.variantId);
    if (!row) continue;

    const images = (row.products.images as unknown as Array<{ src: string; is_default?: boolean }> | null) ?? [];
    const fallbackImage = images.find((i) => i.is_default)?.src ?? images[0]?.src ?? null;

    const snapshot: CartLineSnapshot = {
      productName: row.products.title,
      productSlug: row.products.slug,
      variantLabel: row.title ?? "",
      unitPriceCents: row.price_cents,
      imageUrl: row.image_url ?? fallbackImage,
    };
    lines.push({ productId: row.product_id, variantId: row.id, qty: pair.qty, snapshot });
  }

  return { lines, droppedCount: pairs.length - lines.length };
}

export async function fetchDbCartPairs(userId: string): Promise<CartPair[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("cart_items").select("product_id, variant_id, quantity").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => ({ productId: r.product_id, variantId: r.variant_id, qty: r.quantity }));
}

// Fire-and-forget target for individual mutations — writes the final
// computed quantity (the caller already knows it), not a delta.
export async function upsertCartItem(userId: string, productId: string, variantId: string, qty: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("cart_items")
    .upsert(
      { user_id: userId, product_id: productId, variant_id: variantId, quantity: Math.min(qty, 99) },
      { onConflict: "user_id,variant_id" }
    );
  if (error) console.error("[cart] upsert failed", error);
}

export async function deleteCartItem(userId: string, variantId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId).eq("variant_id", variantId);
  if (error) console.error("[cart] delete failed", error);
}

export async function deleteAllCartItems(userId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
  if (error) console.error("[cart] clear failed", error);
}

// Sums quantities for variants present in both the guest cart and the
// existing DB cart, capped at 99 (matches the DB check constraint).
export async function mergeGuestCartIntoDb(userId: string, guestLines: CartLine[]): Promise<void> {
  if (guestLines.length === 0) return;

  const supabase = createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("cart_items")
    .select("variant_id, quantity")
    .eq("user_id", userId)
    .in(
      "variant_id",
      guestLines.map((l) => l.variantId)
    );
  if (fetchError) {
    console.error("[cart] merge: failed to read existing cart", fetchError);
    return;
  }

  const existingQty = new Map((existing ?? []).map((r) => [r.variant_id, r.quantity]));
  const rows = guestLines.map((l) => ({
    user_id: userId,
    product_id: l.productId,
    variant_id: l.variantId,
    quantity: Math.min((existingQty.get(l.variantId) ?? 0) + l.qty, 99),
  }));

  const { error: upsertError } = await supabase.from("cart_items").upsert(rows, { onConflict: "user_id,variant_id" });
  if (upsertError) console.error("[cart] merge: failed to upsert", upsertError);
}
