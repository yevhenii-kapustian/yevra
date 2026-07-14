"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SortKey } from "@/lib/products";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

type SortDropdownProps = {
  value: SortKey;
  onChange: (value: SortKey) => void;
};

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const selected = SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-3 min-w-52 justify-between border border-line bg-white px-3.5 py-2.5 text-[13px] rounded-sm"
      >
        <span>
          Sort: <span className="font-semibold">{selected.label}</span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className="flex-none opacity-70"
          style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .15s ease" }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-line rounded-sm shadow-[0_10px_28px_rgba(0,0,0,0.1)] py-1.5 z-20">
          {SORT_OPTIONS.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 text-[13px] hover:bg-surface"
                style={{
                  color: active ? "var(--accent)" : "var(--ink)",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
