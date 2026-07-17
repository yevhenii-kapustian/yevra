"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  formatCents,
  FREE_SHIPPING_THRESHOLD_CENTS,
  STANDARD_SHIPPING_COST_CENTS,
  type EnrichedProduct,
} from "@/lib/products";
import { useAuth } from "@/context/AuthContext";
import { readGuestCart, writeGuestCart, clearGuestCart } from "@/lib/cart-storage";
import {
  hydrateFreshCartLines,
  fetchDbCartPairs,
  upsertCartItem,
  deleteCartItem,
  deleteAllCartItems,
  mergeGuestCartIntoDb,
} from "@/lib/cart-data";

export type CartLineSnapshot = {
  productName: string;
  productSlug: string;
  variantLabel: string;
  unitPriceCents: number;
  imageUrl: string | null;
};

export type CartLine = {
  productId: string;
  variantId: string;
  qty: number;
  snapshot: CartLineSnapshot;
};

export type EnrichedCartLine = CartLine & {
  lineTotalLabel: string;
};

type CartContextValue = {
  cartLines: EnrichedCartLine[];
  cartCount: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  isHydrated: boolean;
  addToCart: (productId: string, variantId: string, qty: number, snapshot: CartLineSnapshot) => void;
  quickAdd: (product: EnrichedProduct) => void;
  incLine: (variantId: string) => void;
  decLine: (variantId: string) => void;
  removeLine: (variantId: string) => void;
  clearCart: () => void;
  toastMessage: string;
  showToast: (message: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 1800);
  }, []);

  // Single effect covers mount-hydration, login-merge, and logout — keyed on
  // user id so it re-runs exactly on an actual sign-in/sign-out transition,
  // not on every token refresh. Guest -> logged-in merges localStorage into
  // Supabase before loading (so nothing is silently dropped); logged-in ->
  // guest just reloads from localStorage and leaves the DB cart untouched
  // for next login.
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (user) {
        const guestLines = readGuestCart();
        if (guestLines.length > 0) {
          await mergeGuestCartIntoDb(user.id, guestLines).catch((e) => console.error("[cart] merge failed", e));
          clearGuestCart();
        }
        try {
          const pairs = await fetchDbCartPairs(user.id);
          const { lines, droppedCount } = await hydrateFreshCartLines(pairs);
          if (cancelled) return;
          setCart(lines);
          if (droppedCount > 0) showToast("Some items in your cart are no longer available and were removed.");
        } catch (e) {
          console.error("[cart] failed to load cart", e);
          if (!cancelled) setCart([]);
        }
      } else {
        const guestLines = readGuestCart();
        try {
          const { lines, droppedCount } = await hydrateFreshCartLines(
            guestLines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty }))
          );
          if (cancelled) return;
          setCart(lines);
          if (droppedCount > 0) showToast("Some items in your cart are no longer available and were removed.");
        } catch {
          // Offline/network failure — fall back to the stored snapshot
          // rather than showing an empty cart.
          if (!cancelled) setCart(guestLines);
        }
      }
      if (!cancelled) setIsHydrated(true);
    }

    sync();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showToast is stable (useCallback, no deps)
  }, [user?.id]);

  // Guest persistence — logged-in users are DB-backed instead.
  useEffect(() => {
    if (user) return;
    writeGuestCart(cart);
  }, [cart, user]);

  const addToCart = useCallback(
    (productId: string, variantId: string, qty: number, snapshot: CartLineSnapshot) => {
      setCart((prev) => {
        const idx = prev.findIndex((l) => l.variantId === variantId);
        const next =
          idx >= 0
            ? prev.map((l, i) => (i === idx ? { ...l, qty: l.qty + qty } : l))
            : [...prev, { productId, variantId, qty, snapshot }];
        if (user) {
          const newQty = next.find((l) => l.variantId === variantId)!.qty;
          void upsertCartItem(user.id, productId, variantId, newQty);
        }
        return next;
      });
    },
    [user]
  );

  const quickAdd = useCallback(
    (product: EnrichedProduct) => {
      const variant = product.variants.reduce((cheapest, v) => (v.priceCents < cheapest.priceCents ? v : cheapest));
      addToCart(product.id, variant.id, 1, {
        productName: product.name,
        productSlug: product.slug,
        variantLabel: variant.variantLabel,
        unitPriceCents: variant.priceCents,
        imageUrl: variant.imageUrl ?? product.primaryImage,
      });
      showToast(`${product.name} added to cart`);
    },
    [addToCart, showToast]
  );

  const incLine = useCallback(
    (variantId: string) => {
      setCart((prev) => {
        const next = prev.map((l) => (l.variantId === variantId ? { ...l, qty: l.qty + 1 } : l));
        if (user) {
          const line = next.find((l) => l.variantId === variantId);
          if (line) void upsertCartItem(user.id, line.productId, variantId, line.qty);
        }
        return next;
      });
    },
    [user]
  );

  const decLine = useCallback(
    (variantId: string) => {
      setCart((prev) => {
        const current = prev.find((l) => l.variantId === variantId);
        if (!current || current.qty <= 1) return prev;
        const next = prev.map((l) => (l.variantId === variantId ? { ...l, qty: l.qty - 1 } : l));
        if (user) void upsertCartItem(user.id, current.productId, variantId, current.qty - 1);
        return next;
      });
    },
    [user]
  );

  const removeLine = useCallback(
    (variantId: string) => {
      setCart((prev) => {
        if (user) void deleteCartItem(user.id, variantId);
        return prev.filter((l) => l.variantId !== variantId);
      });
    },
    [user]
  );

  const clearCart = useCallback(() => {
    if (user) void deleteAllCartItems(user.id);
    setCart([]);
  }, [user]);

  const cartLines = useMemo<EnrichedCartLine[]>(
    () => cart.map((line) => ({ ...line, lineTotalLabel: formatCents(line.snapshot.unitPriceCents * line.qty) })),
    [cart]
  );

  const cartCount = useMemo(() => cart.reduce((sum, l) => sum + l.qty, 0), [cart]);
  const subtotalCents = useMemo(() => cart.reduce((sum, l) => sum + l.snapshot.unitPriceCents * l.qty, 0), [cart]);
  const shippingCents =
    subtotalCents === 0 || subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_COST_CENTS;
  const totalCents = subtotalCents + shippingCents;

  const value: CartContextValue = {
    cartLines,
    cartCount,
    subtotalCents,
    shippingCents,
    totalCents,
    isHydrated,
    addToCart,
    quickAdd,
    incLine,
    decLine,
    removeLine,
    clearCart,
    toastMessage,
    showToast,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
