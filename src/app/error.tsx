"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-4 py-20 sm:px-8 lg:px-12 text-center">
      <p className="text-sm text-muted mb-4">Something went wrong loading this page.</p>
      <button type="button" onClick={reset} className="text-accent font-semibold">
        Try again
      </button>
    </div>
  );
}
