import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="px-4 py-20 sm:px-8 lg:px-12 text-center">
      <p className="text-sm text-muted mb-4">
        That link is invalid or has expired. Try requesting a new one.
      </p>
      <Link href="/login" className="text-accent font-semibold">
        Back to login
      </Link>
    </div>
  );
}
