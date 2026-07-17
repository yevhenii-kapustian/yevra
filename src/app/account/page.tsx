import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server-client";
import { signOut } from "@/app/actions/auth";
import { formatCents } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  // RLS ("Users can view own orders") already scopes this to the current
  // user — no explicit .eq('user_id', ...) filter needed. payment_status
  // filter excludes abandoned/pending checkouts (order rows exist before
  // payment completes — see src/app/actions/checkout.ts) so the customer
  // never sees a "zombie" order they never actually paid for.
  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, total_cents, fulfillment_status, created_at")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });

  return (
    <div className="px-4 py-16 sm:px-8 lg:px-12 max-w-165 mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">
            {profile?.full_name ? `Hi, ${profile.full_name}` : "Your account"}
          </h1>
          <p className="text-[13px] text-muted">{user.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-[13px] font-semibold text-accent underline">
            Sign out
          </button>
        </form>
      </div>

      <h2 className="text-base font-extrabold mb-4">Order history</h2>
      {orders && orders.length > 0 ? (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <div
              key={order.order_number}
              className="flex items-center justify-between border-b border-line pb-3 text-[13.5px]"
            >
              <div>
                <div className="font-semibold">Order #{order.order_number}</div>
                <div className="text-muted capitalize">{order.fulfillment_status}</div>
              </div>
              <span className="font-bold">{formatCents(order.total_cents)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted">No orders yet.</p>
      )}
    </div>
  );
}
