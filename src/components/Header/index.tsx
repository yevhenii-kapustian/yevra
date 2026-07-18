"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { label: "New", href: "/catalog/new" },
  { label: "Shop", href: "/catalog/shop" },
  { label: "Accessories", href: "/catalog/accessories" },
];

export default function Header() {
  const { cartCount } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-line">
      <div className="flex items-center justify-between gap-5 px-4 py-4.5 sm:px-8 lg:px-12 flex-wrap">
        <Link href="/" className="text-[22px] font-extrabold tracking-[2px] text-ink">
          YEVRA
        </Link>

        <nav className="flex gap-4 sm:gap-6 lg:gap-7 flex-wrap">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm font-semibold tracking-wide py-1 border-b-2 hover:text-accent ${
                  active ? "text-accent border-accent" : "text-ink border-transparent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4.5">
          <Search size={20} strokeWidth={1.6} className="cursor-pointer opacity-75" />
          <Link href={user ? "/account" : "/login"} className="flex items-center">
            <User size={20} strokeWidth={1.6} className="cursor-pointer opacity-75" />
          </Link>
          <Link href="/cart" className="relative flex items-center">
            <ShoppingBag size={21} strokeWidth={1.6} className="opacity-85" />
            {cartCount > 0 && (
              <div className="absolute -top-2 -right-2.5 bg-accent text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                {cartCount}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
