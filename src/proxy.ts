import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Logged-in users have no reason to see these — bounce them to their
// account instead. Deliberately excludes /reset-password: that page is
// reached via the recovery email link, which establishes its own temporary
// session, so blocking it here would break the password-reset flow itself.
const REDIRECT_IF_LOGGED_IN_PATHS = ["/login", "/signup", "/forgot-password"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Refreshes the session cookie if needed. Uses getUser() (not getClaims())
  // so a revoked/banned session is caught server-side, not just an expired JWT.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && REDIRECT_IF_LOGGED_IN_PATHS.includes(request.nextUrl.pathname)) {
    const redirectResponse = NextResponse.redirect(new URL("/account", request.url));
    // Carry over any refreshed session cookie onto the redirect response —
    // it was written to `response` above, not to this new one.
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
