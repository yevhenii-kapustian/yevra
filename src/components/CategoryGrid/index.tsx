import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    label: "Shop",
    href: "/catalog/shop",
    bg: "oklch(93% 0.01 55)",
    images: ["/landing/Person Closeup.png", "/landing/Lifestyle 2.jpg"],
  },
  {
    label: "Accessories",
    href: "/catalog/accessories",
    bg: "oklch(93% 0.015 30)",
    images: ["/landing/Teddy Bear.jpg", "/landing/Hanging, Black.jpg"],
  },
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
            className="group relative aspect-4/5 overflow-hidden rounded"
            style={{ background: cat.bg }}
          >
            {cat.images.length > 0 ? (
              <div className="absolute inset-0 flex">
                {cat.images.map((src) => (
                  <div key={src} className="relative flex-1 h-full">
                    <Image
                      src={src}
                      alt={cat.label}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      quality={95}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-[11px] tracking-wide text-black/55">CATEGORY PHOTO</span>
              </div>
            )}
            {cat.images.length > 0 && (
              <div
                className="absolute inset-x-0 bottom-0 h-2/5 opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(to top, oklch(15% 0.01 50 / 75%), transparent)" }}
              />
            )}
            <div className="p-8 absolute left-5 bottom-5 right-5 max-sm:p-0">
              <div
                className={`text-[11px] font-bold tracking-[1.5px] mb-1.5 ${cat.images.length > 0 ? "text-white/80" : "text-muted"}`}
              >
                CATEGORY
              </div>
              <div className={`text-2xl font-extrabold mb-2 ${cat.images.length > 0 ? "text-white" : "text-ink"}`}>
                {cat.label}.
              </div>
              <div
                className={`text-[12.5px] font-bold inline-flex items-center gap-1.5 ${cat.images.length > 0 ? "text-white" : "text-ink"} group-hover:gap-2.5 transition-all`}
              >
                Shop the Edit <span aria-hidden="true">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
