import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="flex flex-wrap-reverse items-stretch bg-[oklch(95%_0.02_55)]">
      <div className="flex-1 min-w-95 flex flex-col justify-center gap-4.5 p-8 sm:p-16 lg:p-20">
        <div className="text-xs font-bold tracking-[2px] text-accent">NEW SEASON</div>
        <h1 className="text-[32px] sm:text-5xl font-extrabold leading-tight max-w-130">
          Elevate Your Everyday Wardrobe
        </h1>
        <p className="text-[15px] leading-relaxed text-muted max-w-110">
          Considered basics and statement outerwear, cut for real life. New arrivals dropping weekly.
        </p>
        <div>
          <Link
            href="/catalog/men"
            className="inline-block bg-ink text-white px-7 py-3.5 text-sm font-bold tracking-wide rounded-sm hover:bg-accent"
          >
            Shop Men
          </Link>
        </div>
      </div>
      <div
        className="flex-1 min-w-95 min-h-85 flex items-center justify-center"
        style={{
          background:
            "repeating-linear-gradient(135deg, color-mix(in srgb, oklch(64% 0.19 45) 16%, white) 0 18px, color-mix(in srgb, oklch(64% 0.19 45) 8%, white) 18px 36px)",
        }}
      >
        <span className="font-mono text-xs tracking-wide text-black/60">LOOKBOOK PHOTO</span>
      </div>
    </section>
  );
}
