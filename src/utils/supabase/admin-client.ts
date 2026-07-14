import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server-only. Uses the service role key and bypasses Row Level Security.
// No cookies/session involved — this is machine-to-machine (Printify sync,
// order creation), not a user-facing request. Never import from client code.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
