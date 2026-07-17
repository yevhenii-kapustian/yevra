import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server-client";
import { signOut } from "@/app/actions/auth";
import { formatCents } from "@/lib/products";
import StatusBadge from "@/components/StatusBadge";
import { formatOrderDate } from "@/lib/format-date";

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
  // filter excludes abandoned/unpaid checkouts (order rows exist before
  // payment completes — see src/app/actions/checkout.ts) so the customer
  // never sees a "zombie" order they never actually paid for.
  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, total_cents, fulfillment_status, created_at")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });

  return (
    <div className="px-4 py-16 sm:px-8 lg:px-12 max-w-165 mx-auto">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">
            {profile?.full_name ? `Hi, ${profile.full_name}` : "Your account"}
          </h1>
          <p className="text-[13px] text-muted">{user.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-[13px] font-semibold text-accent hover:underline">
            Sign out
          </button>
        </form>
      </div>

      <h2 className="text-base font-extrabold mb-4">Order history</h2>
      {orders && orders.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {orders.map((order) => (
            <Link
              key={order.order_number}
              href={`/account/orders/${order.order_number}`}
              className="flex items-center justify-between gap-4 bg-surface rounded-sm px-4.5 py-4 hover:bg-line/60 transition-colors"
            >
              <div>
                <div className="text-[13.5px] font-bold mb-1">Order #{order.order_number}</div>
                <div className="text-[12px] text-muted">{formatOrderDate(order.created_at)}</div>
              </div>
              <div className="flex items-center gap-3.5">
                <StatusBadge status={order.fulfillment_status} />
                <span className="text-[13.5px] font-bold min-w-16 text-right">{formatCents(order.total_cents)}</span>
                <span className="text-muted">›</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-[13px] text-muted bg-surface rounded-sm px-4.5 py-8 text-center">No orders yet.</div>
      )}
    </div>
  );
}
