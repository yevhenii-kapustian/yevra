import Link from "next/link";

type OrderConfirmationProps = {
  orderNumber: string;
};

export default function OrderConfirmation({ orderNumber }: OrderConfirmationProps) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-full bg-accent text-white text-3xl flex items-center justify-center mx-auto mb-6">
        ✓
      </div>
      <div className="text-2xl font-extrabold mb-2.5">Order placed!</div>
      <div className="text-sm text-muted mb-1.5">
        Order #{orderNumber} — a confirmation has been sent to your email.
      </div>
      <Link
        href="/"
        className="inline-block mt-5.5 bg-ink text-white px-6.5 py-3.25 text-sm font-bold rounded-sm"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
