"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/utils/supabase/admin-client";
import { getStripe } from "@/utils/stripe/client";
import { adminNoteSchema } from "@/lib/validation/returns";

// Every admin action re-runs requireAdmin() itself, not just the /admin
// layout — a Server Action is directly POST-able regardless of which page
// rendered the form that called it.

// Deliberately does NOT call Printify's create-order API — that would place
// a brand new, full-price order on the merchant's own Printify account every
// time, even when the defect was Printify's own fault (in which case the
// real free-reprint/credit only happens through Printify's own claims
// process, outside this app). This just records the decision and tells the
// customer a replacement is coming; the admin places the actual reorder
// themselves (via Printify's claim flow if it's their fault, or manually
// otherwise) once they know whether they're being charged again for it.
export async function reprintReturn(requestId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const adminNote = String(formData.get("adminNote") ?? "").trim() || null;
  // Free-text, admin-entered reference (Printify claim ticket id, or the
  // order id of a manually-placed reorder) — purely for the admin's own
  // record-keeping, never read by any automated flow.
  const externalReorderRef = String(formData.get("externalReorderRef") ?? "").trim() || null;
  const admin = createAdminClient();

  await admin
    .from("return_requests")
    .update({
      status: "resolved",
      resolution_type: "reprint",
      admin_note: adminNote,
      external_reorder_ref: externalReorderRef,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  revalidatePath("/admin/return-requests");
}

export async function refundReturn(requestId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const adminNote = String(formData.get("adminNote") ?? "").trim() || null;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("return_requests")
    .select("id, order_id, orders(payment_intent_id), order_items(line_total_cents)")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();

  if (!request || !request.orders?.payment_intent_id || !request.order_items) {
    revalidatePath("/admin/return-requests");
    return;
  }

  try {
    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: request.orders.payment_intent_id,
      amount: request.order_items.line_total_cents,
    });

    // Only that one line item is refunded, not the whole order — re-check
    // the payment intent's actual refunded total (multiple items across
    // separate requests could each partially refund the same order over
    // time) rather than always defaulting to "partially_refunded".
    const intent = await stripe.paymentIntents.retrieve(request.orders.payment_intent_id, {
      expand: ["latest_charge"],
    });
    const charge = intent.latest_charge;
    const isFullyRefunded =
      typeof charge !== "string" && charge != null && charge.amount_refunded >= charge.amount;

    await admin
      .from("orders")
      .update({ payment_status: isFullyRefunded ? "refunded" : "partially_refunded" })
      .eq("id", request.order_id);

    await admin
      .from("return_requests")
      .update({
        status: "resolved",
        resolution_type: "refund",
        admin_note: adminNote,
        stripe_refund_id: refund.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("status", "pending");
  } catch (err) {
    console.error(`[admin-returns] failed to refund for return request ${requestId}`, err);
  }

  revalidatePath("/admin/return-requests");
}

// Reject is the only outcome where the customer gets no other explanation
// (no reprint order, no refund line on their statement), so a note is
// required rather than optional here.
export async function rejectReturn(requestId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = adminNoteSchema.safeParse(formData.get("adminNote"));
  if (!parsed.success) return;

  const admin = createAdminClient();
  await admin
    .from("return_requests")
    .update({
      status: "resolved",
      resolution_type: "reject",
      admin_note: parsed.data,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  revalidatePath("/admin/return-requests");
}
