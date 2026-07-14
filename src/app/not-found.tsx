import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 py-20 sm:px-8 lg:px-12 text-center">
      <p className="text-sm text-muted mb-4">We couldn&apos;t find what you&apos;re looking for.</p>
      <Link href="/" className="text-accent font-semibold">
        Back to home
      </Link>
    </div>
  );
}
