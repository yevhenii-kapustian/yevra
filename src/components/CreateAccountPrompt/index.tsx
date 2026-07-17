"use client";

import { useActionState } from "react";
import { createAccountFromOrder } from "@/app/actions/auth";

const inputClass = "border border-line px-3.5 py-3 text-[13.5px] rounded-sm";

type CreateAccountPromptProps = {
  orderId: string;
  email: string;
};

export default function CreateAccountPrompt({ orderId, email }: CreateAccountPromptProps) {
  const [state, formAction, pending] = useActionState(createAccountFromOrder, undefined);

  return (
    <div className="border-t border-line pt-6 mt-6 text-left">
      <div className="text-sm font-extrabold mb-2">Create an account</div>
      <p className="text-[13px] text-muted mb-4">Save your details and track this order — using {email}.</p>
      <form action={formAction} className="flex gap-3 flex-wrap items-start">
        <input type="hidden" name="orderId" value={orderId} />
        <input
          name="password"
          type="password"
          placeholder="Choose a password"
          required
          minLength={6}
          className={`flex-1 min-w-50 ${inputClass}`}
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-white px-5 py-3 text-sm font-bold rounded-sm hover:bg-accent disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create Account"}
        </button>
      </form>
      {state?.error && <p className="text-xs text-accent mt-2">{state.error}</p>}
    </div>
  );
}
