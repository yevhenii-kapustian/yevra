"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, Paperclip } from "lucide-react";
import { createReturnRequest } from "@/app/actions/returns";

const inputClass = "border border-line px-3.5 py-3 text-[13.5px] rounded-sm w-full";

const REASONS: { value: string; label: string }[] = [
  { value: "defective", label: "Item arrived defective" },
  { value: "damaged_in_shipping", label: "Damaged in shipping" },
  { value: "print_error", label: "Print/design error" },
  { value: "other", label: "Other issue" },
];

type ReasonDropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

// Same open/click-outside/escape pattern as SortDropdown — kept local to this
// form rather than shared, since the reason list only ever appears here.
function ReasonDropdown({ value, onChange }: ReasonDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selected = REASONS.find((r) => r.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className={selected ? "" : "text-muted"}>{selected ? selected.label : "What's the issue?"}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className="flex-none opacity-70"
          style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .15s ease" }}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-line rounded-sm shadow-[0_10px_28px_rgba(0,0,0,0.1)] py-1.5 z-20">
          {REASONS.map((reason) => {
            const active = reason.value === value;
            return (
              <button
                key={reason.value}
                type="button"
                onClick={() => {
                  onChange(reason.value);
                  setOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 text-[13px] hover:bg-surface"
                style={{ color: active ? "var(--accent)" : "var(--ink)", fontWeight: active ? 700 : 500 }}
              >
                {reason.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type PhotoInputProps = {
  fileName: string | null;
  onChange: (fileName: string | null) => void;
};

// Native file inputs render as an unstyled OS button + "No file chosen" —
// hidden here in favor of a button matching the rest of the form's styling
// that just proxies its click to the real (visually hidden) input. Lifted to
// a controlled fileName so the parent can require a photo before enabling submit.
function PhotoInput({ fileName, onChange }: PhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex-none flex items-center gap-1.5 border border-line px-3.5 py-2.5 text-[12.5px] font-semibold rounded-sm hover:bg-surface"
      >
        <Paperclip size={14} strokeWidth={1.75} />
        Add photo
      </button>
      <span className="text-[12.5px] text-muted truncate">{fileName ?? "*"}</span>
      <input
        ref={inputRef}
        type="file"
        name="photo"
        accept="image/*"
        required
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0]?.name ?? null)}
      />
    </div>
  );
}

type ReturnRequestFormProps = {
  orderItemId: string;
};

export default function ReturnRequestForm({ orderItemId }: ReturnRequestFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(createReturnRequest, undefined);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="block mt-2.5 pt-3 border-t border-line text-[12.5px] font-bold text-accent hover:underline"
      >
        Report an issue
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2.5 mt-2.5 pt-3 border-t border-line">
      <input type="hidden" name="orderItemId" value={orderItemId} />
      <input type="hidden" name="reason" value={reason} />
      <ReasonDropdown value={reason} onChange={setReason} />
      <textarea
        name="description"
        placeholder="Describe the issue"
        required
        rows={3}
        className={`${inputClass} resize-none`}
      />
      <PhotoInput fileName={photoName} onChange={setPhotoName} />
      {state?.error && <p className="text-xs text-accent">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !reason || !photoName}
          className="bg-ink text-white px-4 py-2.5 text-[12.5px] font-bold rounded-sm enabled:hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
        >
          {pending ? "Submitting…" : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="px-4 py-2.5 text-[12.5px] font-bold text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
