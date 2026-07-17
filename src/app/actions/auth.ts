"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server-client";
import { createAdminClient } from "@/utils/supabase/admin-client";
import type { ShippingAddress } from "@/lib/checkout-types";

export type AuthActionState = { error?: string; success?: boolean } | undefined;

export async function login(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/account");
}

// Supabase requires email confirmation by default, so there's no session to
// redirect into yet — the signup page swaps to a "check your email" message
// on { success: true } instead of navigating anywhere.
export async function signup(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    // Key must be exactly "full_name" — the handle_new_user() trigger on
    // auth.users reads raw_user_meta_data->>'full_name' to populate
    // profiles.full_name. A different key silently leaves it null.
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: error.message };

  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { error: error.message };

  return { success: true };
}

// Only reachable with a valid recovery session, established by
// /auth/confirm after the user clicks the reset-password email link.
export async function updatePassword(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/account");
}

// Post-purchase account creation, offered on the confirmation page for guest
// checkouts. Unlike signup(), this auto-confirms the email instead of
// sending a confirmation link — a completed Stripe payment against that
// email is a stronger signal than the usual signup flow gets, and matching
// the "one click, no inbox round-trip" pattern most stores use here is worth
// the (accepted, industry-standard) tradeoff: someone could checkout with an
// email they don't own and end up with a confirmed-but-inert account under
// it, but they never gain access to that inbox itself.
export async function createAccountFromOrder(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!orderId || password.length < 6) {
    return { error: "Please enter a password with at least 6 characters." };
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, email, user_id, payment_status, shipping_address")
    .eq("id", orderId)
    .maybeSingle();

  // Guards against: unknown order id, an order that never actually paid, and
  // double-submitting this form once an account already got linked.
  if (!order || order.payment_status !== "paid" || order.user_id) {
    return { error: "This order can't be linked to a new account." };
  }

  const shippingAddress = order.shipping_address as unknown as ShippingAddress;
  const fullName = `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: order.email,
    password,
    email_confirm: true,
    // Key must be exactly "full_name" — see handle_new_user() note above.
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    return { error: "An account with this email may already exist. Try logging in instead." };
  }

  await admin.from("orders").update({ user_id: created.user.id }).eq("id", orderId);

  // createUser() (admin API) doesn't establish a browser session — sign in
  // for real through the cookie-aware client so the session cookie is set.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: order.email, password });
  if (signInError) {
    return { error: "Account created — please log in." };
  }

  redirect("/account");
}
