"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
const SLIDES = [
  {
    video: "/landing/hero-loop.mp4",
    videoPosition: "top",
    eyebrow: "NEW SEASON",
    headline: "Elevate Your Everyday Wardrobe",
    subtext: "Considered basics and statement outerwear, cut for real life. New arrivals dropping weekly.",
    ctaLabel: "Shop Now",
    ctaHref: "/catalog/shop",
    productName: "Settled Crewneck",
    productHref: "/product/settled-crewneck",
  },
  {
    video: "/landing/hero-loop-bag.mp4",
    videoPosition: "center 20%",
    eyebrow: "NEW ACCESSORY",
    headline: "Finish the Look",
    subtext: "Small details, worth carrying — bags and accessories made to match the collection.",
    ctaLabel: "Shop Accessories",
    ctaHref: "/catalog/accessories",
    productName: "Held Tote Bag",
    productHref: "/product/held-tote-bag",
  },
];

const AUTOPLAY_MS = 6000;

export default function HeroSection() {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index]);

  const goTo = (next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  };

  return (
    <section className="relative overflow-hidden bg-[oklch(95%_0.02_55)]">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((slide) => (
          <div key={slide.headline} className="w-full flex-none flex flex-wrap-reverse items-stretch">
            <div className="flex-1 min-w-95 flex flex-col justify-center gap-4.5 p-8 sm:p-16 lg:p-20">
              <div className="text-xs font-bold tracking-[2px] text-accent">{slide.eyebrow}</div>
              <h1 className="text-[32px] sm:text-5xl font-extrabold leading-tight max-w-130">{slide.headline}</h1>
              <p className="text-[15px] leading-relaxed text-muted max-w-110">{slide.subtext}</p>
              <div>
                <Link
                  href={slide.ctaHref}
                  className="inline-block bg-ink text-white px-7 py-3.5 text-sm font-bold tracking-wide rounded-sm hover:bg-accent"
                >
                  {slide.ctaLabel}
                </Link>
              </div>
            </div>
            <Link
              href={slide.productHref}
              className="group flex-1 min-w-95 min-h-85 relative overflow-hidden bg-[oklch(90%_0.02_55)]"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: slide.videoPosition }}
                src={slide.video}
              />
              <span className="absolute top-5 right-5 sm:top-6 sm:right-6 inline-flex items-center gap-2 bg-white/90 text-ink text-[12px] font-semibold pl-2.5 pr-3.5 py-2 rounded-full group-hover:bg-white transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-accent flex-none" />
                {slide.productName}
              </span>
            </Link>
          </div>
        ))}
      </div>

      {SLIDES.length > 1 && (
        <div className="flex gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.headline}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className="relative h-[2] flex-1 overflow-hidden bg-ink/25"
            >
              {i < index && <div className="absolute inset-y-0 left-0 w-full bg-accent" />}
              {i === index && (
                <div
                  key={index}
                  className="absolute inset-y-0 left-0 bg-accent"
                  style={{ animation: `heroProgress ${AUTOPLAY_MS}ms linear forwards` }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
