"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getProductById, type RawProduct } from "@/lib/products";

type CartLine = { productId: string; size: string; qty: number };

export type EnrichedCartLine = CartLine & {
  product: RawProduct;
  lineTotalLabel: string;
};

type CartContextValue = {
  cartLines: EnrichedCartLine[];
  cartCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  addToCart: (productId: string, size: string, qty: number) => void;
  quickAdd: (product: RawProduct) => void;
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

  const addToCart = useCallback((productId: string, size: string, qty: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === productId && l.size === size);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, { productId, size, qty }];
    });
  }, []);

  const quickAdd = useCallback(
    (product: RawProduct) => {
      const size = product.sizes[Math.floor(product.sizes.length / 2)];
      addToCart(product.id, size, 1);
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

  const cartLines = useMemo<EnrichedCartLine[]>(() => {
    return cart.flatMap((line) => {
      const product = getProductById(line.productId);
      if (!product) return [];
      return [{ ...line, product, lineTotalLabel: "$" + product.price * line.qty }];
    });
  }, [cart]);

  const cartCount = useMemo(() => cart.reduce((sum, l) => sum + l.qty, 0), [cart]);
  const subtotal = useMemo(() => cartLines.reduce((sum, l) => sum + l.product.price * l.qty, 0), [cartLines]);
  const shipping = subtotal > 75 || subtotal === 0 ? 0 : 8;
  const total = subtotal + shipping;

  const value: CartContextValue = {
    cartLines,
    cartCount,
    subtotal,
    shipping,
    total,
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
