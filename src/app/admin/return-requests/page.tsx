import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin-client";
import { formatCents } from "@/lib/products";
import { formatOrderDate } from "@/lib/format-date";
import { reprintReturn, refundReturn, rejectReturn } from "@/app/actions/admin-returns";
import type { ShippingAddress } from "@/lib/checkout-types";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  defective: "Item arrived defective",
  damaged_in_shipping: "Damaged in shipping",
  print_error: "Print/design error",
  other: "Other issue",
};

const RESOLUTION_LABELS: Record<string, string> = {
  reprint: "Reprinted",
  refund: "Refunded",
  reject: "Rejected",
};

export default async function AdminPage() {
  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("return_requests")
    .select(
      "id, reason, description, photo_url, created_at, order_item_id, orders(order_number, shipping_address), order_items(title, variant_title, quantity, line_total_cents, image_url)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: resolved } = await admin
    .from("return_requests")
    .select(
      "id, reason, resolution_type, admin_note, external_reorder_ref, resolved_at, printify_reprint_order_id, stripe_refund_id, orders(order_number), order_items(title)"
    )
    .eq("status", "resolved")
    .order("resolved_at", { ascending: false })
    .limit(50);

  return (
    <div className="px-4 py-16 sm:px-8 lg:px-12 max-w-165 mx-auto">
      <Link href="/admin" className="text-[13px] font-semibold text-muted hover:text-ink mb-6 inline-block">
        ‹ Admin
      </Link>
      <h1 className="text-2xl font-extrabold mb-8">Return requests</h1>

      <div className="flex flex-col gap-4 mb-12">
        {pending?.length ? (
          pending.map((request) => {
            if (!request.orders || !request.order_items) return null;
            const address = request.orders.shipping_address as unknown as ShippingAddress;

            return (
              <div key={request.id} className="bg-surface rounded-sm p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[13px] font-bold">Order #{request.orders.order_number}</span>
                  <span className="text-[12px] text-muted">{formatOrderDate(request.created_at)}</span>
                </div>

                <div className="text-[13.5px]">
                  <div className="font-semibold">{request.order_items.title}</div>
                  {request.order_items.variant_title && (
                    <div className="text-[12.5px] text-muted">{request.order_items.variant_title}</div>
                  )}
                  <div className="text-[12.5px] text-muted">
                    Qty {request.order_items.quantity} · {formatCents(request.order_items.line_total_cents)}
                  </div>
                </div>

                <div className="text-[13px]">
                  <div className="font-semibold mb-0.5">{REASON_LABELS[request.reason] ?? request.reason}</div>
                  <p className="text-muted">{request.description}</p>
                  {request.photo_url && (
                    <a
                      href={request.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent font-semibold text-[12.5px] inline-block mt-1"
                    >
                      View photo
                    </a>
                  )}
                </div>

                <div className="text-[12px] text-muted">
                  Ships to {address.firstName} {address.lastName}, {address.city}, {address.state}{" "}
                  {address.postalCode}, {address.country}
                </div>

                <form className="flex flex-col gap-2.5 pt-2 border-t border-line">
                  <textarea
                    name="adminNote"
                    placeholder="Note (required to reject, optional otherwise)"
                    rows={2}
                    className="border border-line px-3 py-2 text-[12.5px] rounded-sm resize-none"
                  />
                  <input
                    name="externalReorderRef"
                    placeholder="Printify order # / reorder ref (optional, for Reprint)"
                    className="border border-line px-3 py-2 text-[12.5px] rounded-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      formAction={reprintReturn.bind(null, request.id)}
                      className="bg-ink text-white px-3.5 py-2 text-[12.5px] font-bold rounded-sm hover:bg-accent"
                    >
                      Reprint
                    </button>
                    <button
                      formAction={refundReturn.bind(null, request.id)}
                      className="bg-ink text-white px-3.5 py-2 text-[12.5px] font-bold rounded-sm hover:bg-accent"
                    >
                      Refund
                    </button>
                    <button
                      formAction={rejectReturn.bind(null, request.id)}
                      className="border border-line px-3.5 py-2 text-[12.5px] font-bold rounded-sm hover:bg-line"
                    >
                      Reject
                    </button>
                  </div>
                </form>
              </div>
            );
          })
        ) : (
          <p className="text-[13px] text-muted">No pending requests.</p>
        )}
      </div>

      {resolved && resolved.length > 0 && (
        <div>
          <h2 className="text-sm font-extrabold mb-3.5">Resolved</h2>
          <div className="flex flex-col gap-2.5">
            {resolved.map((request) => (
              <div key={request.id} className="text-[12.5px] text-muted py-2 border-b border-line">
                <span className="font-semibold text-ink">
                  {RESOLUTION_LABELS[request.resolution_type ?? ""] ?? request.resolution_type}
                </span>{" "}
                — Order #{request.orders?.order_number} · {request.order_items?.title}
                {request.admin_note && ` — "${request.admin_note}"`}
                {request.external_reorder_ref && ` — Reorder ref: ${request.external_reorder_ref}`}
                {request.printify_reprint_order_id && ` — Printify #${request.printify_reprint_order_id}`}
                {request.stripe_refund_id && ` — Stripe ${request.stripe_refund_id}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
