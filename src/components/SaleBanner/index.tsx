import Link from "next/link";

export default function SaleBanner() {
  return (
    <section className="mx-4 sm:mx-8 lg:mx-12 mb-14 bg-accent rounded-md p-7 sm:p-14 flex items-center justify-between gap-5 flex-wrap">
      <div>
        <div className="text-2xl font-extrabold text-white">Season Sale — up to 50% off</div>
        <div className="text-sm text-white/85 mt-1.5">Selected styles across men&apos;s, women&apos;s and kids&apos;.</div>
      </div>
      <Link
        href="/catalog/sale"
        className="bg-white text-accent px-6.5 py-3.5 text-sm font-bold rounded-sm whitespace-nowrap"
      >
        Shop Sale
      </Link>
    </section>
  );
}
