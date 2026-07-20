import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server-client";
import { formatCents, FALLBACK_IMAGE_BG } from "@/lib/products";
import { formatOrderDate } from "@/lib/format-date";
import StatusBadge from "@/components/StatusBadge";
import ReturnRequestForm from "@/components/ReturnRequestForm";
import type { ShippingAddress } from "@/lib/checkout-types";

const RESOLUTION_MESSAGES: Record<string, string> = {
  reprint: "Approved — a replacement is being printed.",
  refund: "Approved — this item has been refunded.",
  reject: "This request was not approved.",
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS ("Users can view own orders") already scopes this to the current
  // user — matches the same reliance already established on /account. Uses
  // neq rather than eq("payment_status", "paid") so a since-refunded order
  // (still a real completed purchase, see src/app/actions/admin-returns.ts)
  // doesn't 404 out from under the customer.
  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_number, total_cents, subtotal_cents, shipping_cents, fulfillment_status, created_at, shipping_address, order_items(id, title, variant_title, quantity, unit_price_cents, line_total_cents, image_url)"
    )
    .eq("order_number", orderNumber)
    .neq("payment_status", "unpaid")
    .maybeSingle();

  if (!order) notFound();

  const address = order.shipping_address as unknown as ShippingAddress;

  // Queried separately (rather than embedded on order_items above) since
  // order_item_id's uniqueness makes it a reverse one-to-one relation that
  // PostgREST embeds inconsistently depending on schema-cache detection —
  // a flat map keyed by order_item_id is simpler and unambiguous either way.
  const { data: returnRequestRows } = await supabase
    .from("return_requests")
    .select("order_item_id, status, resolution_type, admin_note")
    .in(
      "order_item_id",
      order.order_items.map((item) => item.id)
    );
  const returnRequestsByItemId = new Map((returnRequestRows ?? []).map((r) => [r.order_item_id, r]));

  return (
    <div className="px-4 py-16 sm:px-8 lg:px-12 max-w-165 mx-auto">
      <Link href="/account" className="text-[13px] font-semibold text-muted hover:text-ink mb-6 inline-block">
        ‹ Back to account
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Order #{order.order_number}</h1>
          <p className="text-[13px] text-muted">{formatOrderDate(order.created_at)}</p>
        </div>
        <StatusBadge status={order.fulfillment_status} />
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {order.order_items.map((item) => {
          const returnRequest = returnRequestsByItemId.get(item.id);
          return (
            <div key={item.id} className="bg-surface rounded-sm p-3.5">
              <div className="flex gap-4 items-center">
                <div
                  className="relative w-16 h-20 flex-none rounded-[3px] overflow-hidden"
                  style={{ background: FALLBACK_IMAGE_BG }}
                >
                  {item.image_url && (
                    <Image src={item.image_url} alt="" fill className="object-cover" sizes="64px" quality={95} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">{item.title}</div>
                  {item.variant_title && <div className="text-[12.5px] text-muted mb-1">{item.variant_title}</div>}
                  <div className="text-[12.5px] text-muted">
                    Qty {item.quantity} × {formatCents(item.unit_price_cents)}
                  </div>
                </div>
                <span className="text-[14px] font-bold">{formatCents(item.line_total_cents)}</span>
              </div>

              {order.fulfillment_status !== "cancelled" &&
                (!returnRequest ? (
                  <ReturnRequestForm orderItemId={item.id} />
                ) : returnRequest.status === "pending" ? (
                  <p className="text-[12.5px] text-muted mt-2.5 pt-3 border-t border-line">
                    Your report is under review.
                  </p>
                ) : (
                  <div className="text-[12.5px] mt-2.5 pt-3 border-t border-line">
                    <p className="text-muted">{RESOLUTION_MESSAGES[returnRequest.resolution_type ?? ""]}</p>
                    {returnRequest.admin_note && (
                      <p className="text-muted mt-1">&ldquo;{returnRequest.admin_note}&rdquo;</p>
                    )}
                  </div>
                ))}
            </div>
          );
        })}
      </div>

      <div className="max-w-80 ml-auto mb-8">
        <div className="flex justify-between text-[13px] mb-1.5 text-muted">
          <span>Subtotal</span>
          <span>{formatCents(order.subtotal_cents)}</span>
        </div>
        <div className="flex justify-between text-[13px] mb-3.5 text-muted">
          <span>Shipping</span>
          <span>{order.shipping_cents === 0 ? "Free" : formatCents(order.shipping_cents)}</span>
        </div>
        <div className="flex justify-between text-base font-extrabold pt-3.5 border-t border-line">
          <span>Total</span>
          <span>{formatCents(order.total_cents)}</span>
        </div>
      </div>

      <div className="border-t border-line pt-6">
        <div className="text-[12.5px] font-bold mb-1.5">Shipping to</div>
        <div className="text-[13px] text-muted leading-relaxed">
          {address.firstName} {address.lastName}
          <br />
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
          <br />
          {address.city}, {address.state} {address.postalCode}
          <br />
          {address.country}
        </div>
      </div>
    </div>
  );
}
