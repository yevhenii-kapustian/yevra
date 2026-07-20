import { createClient } from "@/utils/supabase/server-client";
import type { Database } from "./database.types";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"] & {
  product_variants: Database["public"]["Tables"]["product_variants"]["Row"][];
};

const PRODUCT_WITH_VARIANTS_SELECT = "*, product_variants(*)";

export async function getActiveProductRows(): Promise<ProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_VARIANTS_SELECT)
    .eq("status", "active")
    .order("printify_created_at", { ascending: false });

  if (error) throw error;
  return data as ProductRow[];
}

export async function getProductRowBySlug(slug: string): Promise<ProductRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_VARIANTS_SELECT)
    .eq("status", "active")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as ProductRow | null;
}
