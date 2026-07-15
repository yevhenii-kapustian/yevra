"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  formatCents,
  FREE_SHIPPING_THRESHOLD_CENTS,
  STANDARD_SHIPPING_COST_CENTS,
  type EnrichedProduct,
} from "@/lib/products";

export type CartLineSnapshot = {
  productName: string;
  productSlug: string;
  variantLabel: string;
  unitPriceCents: number;
  imageUrl: string | null;
};

type CartLine = {
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
  addToCart: (productId: string, variantId: string, qty: number, snapshot: CartLineSnapshot) => void;
  quickAdd: (product: EnrichedProduct) => void;
  incLine: (index: number) => void;
  decLine: (index: number) => void;
  removeLine: (index: number) => void;
  clearCart: () => void;
  toastMessage: string;
  showToast: (message: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 1800);
  }, []);

  const addToCart = useCallback((productId: string, variantId: string, qty: number, snapshot: CartLineSnapshot) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === productId && l.variantId === variantId);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { productId, variantId, qty, snapshot }];
    });
  }, []);

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

  const incLine = useCallback((index: number) => {
    setCart((prev) => {
      const next = prev.slice();
      next[index] = { ...next[index], qty: next[index].qty + 1 };
      return next;
    });
  }, []);

  const decLine = useCallback((index: number) => {
    setCart((prev) => {
      if (prev[index].qty <= 1) return prev;
      const next = prev.slice();
      next[index] = { ...next[index], qty: next[index].qty - 1 };
      return next;
    });
  }, []);

  const removeLine = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartLines = useMemo<EnrichedCartLine[]>(
    () => cart.map((line) => ({ ...line, lineTotalLabel: formatCents(line.snapshot.unitPriceCents * line.qty) })),
    [cart]
  );

  const cartCount = useMemo(() => cart.reduce((sum, l) => sum + l.qty, 0), [cart]);
  const subtotalCents = useMemo(
    () => cart.reduce((sum, l) => sum + l.snapshot.unitPriceCents * l.qty, 0),
    [cart]
  );
  const shippingCents =
    subtotalCents === 0 || subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_COST_CENTS;
  const totalCents = subtotalCents + shippingCents;

  const value: CartContextValue = {
    cartLines,
    cartCount,
    subtotalCents,
    shippingCents,
    totalCents,
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
