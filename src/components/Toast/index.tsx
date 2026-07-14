"use client";

import { useCart } from "@/context/CartContext";

export default function Toast() {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div
      className="fixed bottom-7 left-1/2 bg-ink text-white px-5.5 py-3 rounded text-[13.5px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.2)] z-100"
      style={{ animation: "toastIn .2s ease-out", transform: "translateX(-50%)" }}
    >
      {toastMessage}
    </div>
  );
}
