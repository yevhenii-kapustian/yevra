"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";

const inputClass = "border border-line px-3.5 py-3 text-[13.5px] rounded-sm w-full";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return (
      <div className="px-4 py-20 sm:px-8 lg:px-12 max-w-105 mx-auto text-center">
        <p className="text-sm text-muted mb-4">If an account exists for that email, a reset link is on its way.</p>
        <Link href="/login" className="text-accent font-semibold">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-16 sm:px-8 lg:px-12 max-w-105 mx-auto">
      <h1 className="text-2xl font-extrabold mb-2.5">Reset password</h1>
      <p className="text-[13px] text-muted mb-6">We&apos;ll email you a link to set a new password.</p>
      <form action={formAction} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email address" required className={inputClass} />
        {state?.error && <p className="text-xs text-accent">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-ink text-white py-3.5 text-sm font-bold rounded-sm hover:bg-accent disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <div className="mt-5 text-[13px] text-muted">
        <Link href="/login" className="text-accent font-semibold">
          Back to login
        </Link>
      </div>
    </div>
  );
}
