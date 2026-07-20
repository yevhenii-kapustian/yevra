"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import SearchOverlay from "@/components/SearchOverlay";

const NAV_ITEMS = [
  { label: "New", href: "/catalog/new" },
  { label: "Shop", href: "/catalog/shop" },
  { label: "Accessories", href: "/catalog/accessories" },
];

// Matches Tailwind's `sm` breakpoint. Below it, the inline nav-shrinks/
// search-grows trick has no room to work (there's no nav text slot to grow
// into once it's already a hamburger icon), so mobile gets a plain
// full-width panel instead — same SearchOverlay, mounted in only one of the
// two places at a time so it never runs its fetch/listeners twice.
const DESKTOP_QUERY = "(min-width: 640px)";

export default function Header() {
  const { cartCount } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const toggleSearch = () => {
    setMobileNavOpen(false);
    setSearchOpen((o) => !o);
  };
  const toggleMobileNav = () => {
    setSearchOpen(false);
    setMobileNavOpen((o) => !o);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-line">
      <div className="flex items-center justify-between gap-3 sm:gap-5 px-4 py-4.5 sm:px-8 lg:px-12">
        <Link href="/" className="text-[22px] font-extrabold tracking-[2px] text-ink flex-none">
          YEVRA
        </Link>

        <div className="hidden sm:flex flex-1 relative items-center min-w-0">
          {/* Absolutely centered on the header regardless of the search
              zone's own box below — decouples "nav is dead-center" from the
              flex math needed for the search-grow animation. */}
          <nav
            className="absolute left-1/2 -translate-x-1/2 flex gap-4 sm:gap-6 lg:gap-7 whitespace-nowrap transition-opacity duration-200"
            style={{ opacity: searchOpen ? 0 : 1, pointerEvents: searchOpen ? "none" : "auto" }}
          >
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

          <div
            className="grid flex-1 transition-[grid-template-columns] duration-300 ease-out min-w-0"
            style={{ gridTemplateColumns: searchOpen ? "1fr" : "0fr", pointerEvents: searchOpen ? "auto" : "none" }}
          >
            <div className="min-w-0 pl-1">
              {isDesktop && <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />}
            </div>
          </div>
        </div>

        <div className="flex-1 sm:hidden" />

        <div className="flex items-center gap-4 sm:gap-4.5 flex-none">
          <button
            type="button"
            onClick={toggleMobileNav}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            className="sm:hidden flex items-center"
          >
            {mobileNavOpen ? (
              <X size={22} strokeWidth={1.6} className="cursor-pointer opacity-75" />
            ) : (
              <Menu size={22} strokeWidth={1.6} className="cursor-pointer opacity-75" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleSearch}
            aria-label={searchOpen ? "Close search" : "Search"}
            aria-expanded={searchOpen}
            className="flex items-center"
          >
            {searchOpen ? (
              <X size={20} strokeWidth={1.6} className="cursor-pointer opacity-75" />
            ) : (
              <Search size={20} strokeWidth={1.6} className="cursor-pointer opacity-75" />
            )}
          </button>
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

      {mobileNavOpen && (
        <nav className="sm:hidden absolute left-0 right-0 top-full border-t border-line bg-white px-4 py-1 flex flex-col shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`py-3 text-[15px] font-semibold border-b border-line last:border-b-0 ${
                  active ? "text-accent" : "text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      {searchOpen && !isDesktop && (
        <div className="sm:hidden absolute left-0 right-0 top-full border-t border-line bg-white px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
      )}
    </header>
  );
}
