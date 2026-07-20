"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FALLBACK_IMAGE_BG } from "@/lib/products";
import type { SearchResult } from "@/lib/products-data";

const DEBOUNCE_MS = 250;

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

// Rendered inline in Header's nav slot (Header animates the width via a
// grid-template-columns 0fr/1fr transition around this) — this component
// only owns the input + its results dropdown, not any page-width panel.
export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const loading = open && query.trim() !== debouncedQuery.trim();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetches even for an empty query — an empty query browses the full
  // catalog (see searchProducts) so opening search isn't just a blank panel.
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery.trim())}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { results: SearchResult[] }) => setResults(data.results))
      .catch(() => {
        // Aborted (superseded by a newer keystroke) — ignore.
      });

    return () => controller.abort();
  }, [debouncedQuery, open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products…"
        tabIndex={open ? 0 : -1}
        className="w-full min-w-0 text-[15px] font-medium outline-none placeholder:text-muted bg-transparent"
      />

      {open && (
        <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-line rounded-sm shadow-[0_10px_28px_rgba(0,0,0,0.1)] max-h-[70vh] overflow-y-auto z-20">
          {loading ? (
            <p className="text-[13px] text-muted px-4 py-4">Searching…</p>
          ) : results.length > 0 ? (
            <div className="flex flex-col p-2">
              {results.map((product) => (
                <Link
                  key={product.slug}
                  href={`/product/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3.5 rounded-sm px-2 py-2 hover:bg-surface transition-colors"
                >
                  <div
                    className="relative w-12 h-15 flex-none rounded-[3px] overflow-hidden"
                    style={{ background: FALLBACK_IMAGE_BG }}
                  >
                    {product.image && (
                      <Image src={product.image} alt="" fill className="object-cover" sizes="48px" quality={95} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">{product.name}</div>
                    <div className="text-[12.5px] text-muted">{product.priceLabel}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted px-4 py-4">
              {query.trim() ? <>No products found for &ldquo;{query}&rdquo;.</> : "No products available."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
