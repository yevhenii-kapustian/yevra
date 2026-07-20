import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server-client";

// Lands here from Supabase's "Confirm signup" and "Reset password" email
// links (dashboard templates must be edited to point at
// /auth/confirm?token_hash=...&type=...&next=... — see project notes).
// verifyOtp, not exchangeCodeForSession: that's the OAuth PKCE flow and
// doesn't apply to this email/password-only setup.

// Only ever redirect to a same-site relative path — `next` is untrusted
// input, and Next's redirect() also accepts absolute URLs, so an
// unvalidated value here would be an open redirect.
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/error", request.url));
}
