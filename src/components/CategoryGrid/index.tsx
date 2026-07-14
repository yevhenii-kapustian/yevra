import Link from "next/link";

const CATEGORIES = [
  { label: "Men", href: "/catalog/men", bg: "oklch(93% 0.01 55)" },
  { label: "Women", href: "/catalog/women", bg: "oklch(93% 0.015 30)" },
  { label: "Kids", href: "/catalog/kids", bg: "oklch(93% 0.012 90)" },
];

export default function CategoryGrid() {
  return (
    <section className="px-4 py-14 sm:px-8 lg:px-12">
      <h2 className="text-[22px] font-extrabold mb-6">Shop by Category</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="relative aspect-4/5 overflow-hidden rounded hover:scale-101 transition-transform"
            style={{ background: cat.bg }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-[11px] tracking-wide text-black/55">CATEGORY PHOTO</span>
            </div>
            <div className="absolute left-4.5 bottom-4 text-lg font-extrabold text-ink">{cat.label}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
