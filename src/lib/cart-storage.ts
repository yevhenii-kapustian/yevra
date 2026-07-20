// Client-safe, pure — no Supabase import. Guest-cart persistence layer;
// logged-in users are backed by Supabase instead (see cart-data.ts).
import type { CartLine } from "@/context/CartContext";

const STORAGE_KEY = "yevra_guest_cart_v1";

export function readGuestCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // storage full/disabled — cart just won't persist this session
  }
}

export function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
