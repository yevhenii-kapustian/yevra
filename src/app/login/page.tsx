"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";

const inputClass = "border border-line px-3.5 py-3 text-[13.5px] rounded-sm w-full";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="px-4 py-16 sm:px-8 lg:px-12 max-w-105 mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Log in</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email address" required className={inputClass} />
        <input name="password" type="password" placeholder="Password" required className={inputClass} />
        {state?.error && <p className="text-xs text-accent">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-ink text-white py-3.5 text-sm font-bold rounded-sm hover:bg-accent disabled:opacity-50"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <div className="mt-5 text-[13px] text-muted flex flex-col gap-2">
        <Link href="/forgot-password" className="text-accent font-semibold">
          Forgot password?
        </Link>
        <span>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent font-semibold">
            Sign up
          </Link>
        </span>
      </div>
    </div>
  );
}
