"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";

const inputClass = "border border-line px-3.5 py-3 text-[13.5px] rounded-sm w-full";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, undefined);

  return (
    <div className="px-4 py-16 sm:px-8 lg:px-12 max-w-105 mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Set a new password</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="password"
          type="password"
          placeholder="New password"
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
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
