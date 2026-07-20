import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = createAdminClient();
  const { count: pendingCount } = await admin
    .from("return_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="px-4 py-16 sm:px-8 lg:px-12 max-w-165 mx-auto">
      <h1 className="text-2xl font-extrabold mb-8">Admin</h1>

      <div className="flex flex-col gap-2.5">
        <Link
          href="/admin/orders"
          className="flex items-center justify-between gap-4 bg-surface rounded-sm px-4.5 py-4 hover:bg-line/60 transition-colors"
        >
          <div>
            <div className="text-[13.5px] font-bold mb-1">Orders</div>
            <div className="text-[12px] text-muted">All orders — filter by active, closed, or with issue</div>
          </div>
          <span className="text-muted">›</span>
        </Link>

        <Link
          href="/admin/return-requests"
          className="flex items-center justify-between gap-4 bg-surface rounded-sm px-4.5 py-4 hover:bg-line/60 transition-colors"
        >
          <div>
            <div className="text-[13.5px] font-bold mb-1">Return requests</div>
            <div className="text-[12px] text-muted">
              {pendingCount ? `${pendingCount} pending` : "Nothing pending"}
            </div>
          </div>
          <span className="text-muted">›</span>
        </Link>
      </div>
    </div>
  );
}
