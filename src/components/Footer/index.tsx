import Link from "next/link";

type FooterItem = { label: string; href?: string };

// href is only set for items that already have a real page — the rest are
// deliberately non-clickable placeholders until those pages exist.
const FOOTER_COLUMNS: { title: string; items: FooterItem[] }[] = [
  {
    title: "Shop",
    items: [
      { label: "New Arrivals", href: "/catalog/new" },
      { label: "Accessories", href: "/catalog/accessories" },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "Shipping & Returns" },
      { label: "FAQ" },
      { label: "Size Guide" },
      { label: "Contact Us" },
    ],
  },
  { title: "Company", items: [{ label: "About" }, { label: "Careers" }, { label: "Sustainability" }] },
];

export default function Footer() {
  return (
    <footer className="bg-white text-ink mt-10 border-t border-line">
      <div className="px-4 pt-16 pb-10 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="text-sm font-extrabold tracking-[2.5px] mb-2.5">YEVRA</div>
            <div className="text-[12px] leading-relaxed text-muted max-w-45">
              Wearable reminders for the person you&apos;re becoming.
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-muted mb-3.5">{col.title}</div>
              <div className="flex flex-col gap-2.5 text-[12.5px]">
                {col.items.map((item) =>
                  item.href ? (
                    <Link key={item.label} href={item.href} className="text-ink/80 hover:text-ink transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span key={item.label} className="text-ink/80 cursor-default">
                      {item.label}
                    </span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 sm:px-8 lg:px-12">
        <div className="text-[11px] text-muted">© 2026 Yevra. All rights reserved.</div>
      </div>
    </footer>
  );
}
