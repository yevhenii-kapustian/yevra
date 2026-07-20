import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin-client";
import { formatCents } from "@/lib/products";
import { formatOrderDate } from "@/lib/format-date";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["unfulfilled", "fulfilling", "shipped"];
const CLOSED_STATUSES = ["delivered", "cancelled"];

type StatusFilter = "all" | "active" | "closed" | "issue";

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "closed", label: "Closed" },
  { key: "issue", label: "With issue" },
];

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const filter: StatusFilter = TABS.some((t) => t.key === status) ? (status as StatusFilter) : "all";

  const admin = createAdminClient();

  // Excludes only "unpaid" — an order row exists before payment completes
  // (see src/app/actions/checkout.ts), so an unpaid row is an abandoned
  // checkout, not a real order.
  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, email, total_cents, fulfillment_status, payment_status, created_at")
    .neq("payment_status", "unpaid")
    .order("created_at", { ascending: false });

  const { data: pendingReturnRows } = await admin.from("return_requests").select("order_id").eq("status", "pending");
  const orderIdsWithIssue = new Set((pendingReturnRows ?? []).map((r) => r.order_id));

  const filtered = (orders ?? []).filter((order) => {
    if (filter === "active") return ACTIVE_STATUSES.includes(order.fulfillment_status);
    if (filter === "closed") return CLOSED_STATUSES.includes(order.fulfillment_status);
    if (filter === "issue") return orderIdsWithIssue.has(order.id);
    return true;
  });

  return (
    <div className="px-4 py-16 sm:px-8 lg:px-12 max-w-165 mx-auto">
      <Link href="/admin" className="text-[13px] font-semibold text-muted hover:text-ink mb-6 inline-block">
        ‹ Admin
      </Link>
      <h1 className="text-2xl font-extrabold mb-6">Orders</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/admin/orders" : `/admin/orders?status=${tab.key}`}
            className="px-3.5 py-2 text-[12.5px] font-semibold rounded-sm border border-line"
            style={{
              background: filter === tab.key ? "var(--ink)" : "transparent",
              color: filter === tab.key ? "white" : "var(--ink)",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-[13px] text-muted">No orders here.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-4 bg-surface rounded-sm px-4.5 py-4 flex-wrap"
            >
              <div>
                <div className="text-[13.5px] font-bold mb-1">Order #{order.order_number}</div>
                <div className="text-[12px] text-muted">
                  {order.email} · {formatOrderDate(order.created_at)}
                </div>
                {order.payment_status !== "paid" && (
                  <div className="text-[12px] text-muted capitalize">{order.payment_status.replace("_", " ")}</div>
                )}
              </div>
              <div className="flex items-center gap-3.5">
                {orderIdsWithIssue.has(order.id) && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent text-white whitespace-nowrap">
                    Issue
                  </span>
                )}
                <StatusBadge status={order.fulfillment_status} />
                <span className="text-[13.5px] font-bold min-w-16 text-right">{formatCents(order.total_cents)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
