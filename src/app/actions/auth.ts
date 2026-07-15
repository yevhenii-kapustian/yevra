"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server-client";

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
