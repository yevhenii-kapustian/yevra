"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/actions/auth";

const inputClass = "border border-line px-3.5 py-3 text-[13.5px] rounded-sm w-full";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  if (state?.success) {
    return (
      <div className="px-4 py-20 sm:px-8 lg:px-12 max-w-105 mx-auto text-center">
        <p className="text-sm text-muted mb-4">Check your email to confirm your account before logging in.</p>
        <Link href="/login" className="text-accent font-semibold">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-16 sm:px-8 lg:px-12 max-w-105 mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Create account</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input name="fullName" type="text" placeholder="Full name" required className={inputClass} />
        <input name="email" type="email" placeholder="Email address" required className={inputClass} />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={6}
          className={inputClass}
        />
        {state?.error && <p className="text-xs text-accent">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-ink text-white py-3.5 text-sm font-bold rounded-sm hover:bg-accent disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
      <div className="mt-5 text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-semibold">
          Log in
        </Link>
      </div>
    </div>
  );
}
