"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server-client";
import { createReturnRequestSchema, returnPhotoSchema } from "@/lib/validation/returns";

export type ReturnActionState = { error?: string } | undefined;

function extensionFor(mimeType: string): string {
  return mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
}

// Never trusts the client-submitted orderItemId beyond using it as a lookup
// key — ownership (and that the order actually paid) is re-verified against
// the RLS-scoped client on every submit, matching the posture already
// established for order/account data elsewhere in this codebase.
export async function createReturnRequest(
  _prevState: ReturnActionState,
  formData: FormData
): Promise<ReturnActionState> {
  const fields = createReturnRequestSchema.safeParse({
    orderItemId: formData.get("orderItemId"),
    reason: formData.get("reason"),
    description: formData.get("description"),
  });
  if (!fields.success) {
    return { error: fields.error.issues[0].message };
  }

  const photoResult = returnPhotoSchema.safeParse(formData.get("photo"));
  if (!photoResult.success) {
    return { error: photoResult.error.issues[0].message };
  }

  const { orderItemId, reason, description } = fields.data;
  const photo = photoResult.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // neq("payment_status", "unpaid") rather than eq(..., "paid") — an order
  // that already had a different item refunded/partially_refunded is still
  // a real completed purchase, and its other items must stay reportable.
  const { data: orderItem } = await supabase
    .from("order_items")
    .select("id, order_id, orders!inner(user_id, payment_status, order_number)")
    .eq("id", orderItemId)
    .eq("orders.user_id", user.id)
    .neq("orders.payment_status", "unpaid")
    .maybeSingle();

  if (!orderItem) {
    return { error: "This order item couldn't be found." };
  }

  const { data: existing } = await supabase
    .from("return_requests")
    .select("id")
    .eq("order_item_id", orderItemId)
    .maybeSingle();
  if (existing) {
    return { error: "A request has already been submitted for this item." };
  }

  const path = `${user.id}/${orderItemId}.${extensionFor(photo.type)}`;
  const { error: uploadError } = await supabase.storage
    .from("return-photos")
    .upload(path, photo, { contentType: photo.type, upsert: true });
  if (uploadError) {
    console.error(
      `[returns] failed to upload photo for order item ${orderItemId}, path=${path}`,
      JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError))
    );
    return { error: "Failed to upload photo. Please try again." };
  }
  const photoUrl = supabase.storage.from("return-photos").getPublicUrl(path).data.publicUrl;

  const { error: insertError } = await supabase.from("return_requests").insert({
    order_id: orderItem.order_id,
    order_item_id: orderItemId,
    user_id: user.id,
    reason,
    description,
    photo_url: photoUrl,
  });
  if (insertError) {
    return { error: "Something went wrong submitting your request. Please try again." };
  }

  redirect(`/account/orders/${orderItem.orders.order_number}`);
}
