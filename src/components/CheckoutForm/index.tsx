"use client";

import { formatCents } from "@/lib/products";

type DeliveryMethod = "standard" | "express";
type PaymentMethod = "card" | "cod";

type CheckoutFormProps = {
  deliveryMethod: DeliveryMethod;
  onSelectDelivery: (method: DeliveryMethod) => void;
  standardShippingCents: number;
  expressShippingCents: number;
  paymentMethod: PaymentMethod;
  onSelectPayment: (method: PaymentMethod) => void;
};

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string }[] = [
  { key: "card", label: "Credit / Debit Card" },
  { key: "cod", label: "Cash on Delivery" },
];

const inputClass = "border border-line px-3.5 py-3 text-[13.5px] rounded-sm";

export default function CheckoutForm({
  deliveryMethod,
  onSelectDelivery,
  standardShippingCents,
  expressShippingCents,
  paymentMethod,
  onSelectPayment,
}: CheckoutFormProps) {
  const deliveryOptions: { key: DeliveryMethod; label: string; priceLabel: string }[] = [
    {
      key: "standard",
      label: "Standard Delivery (3–5 days)",
      priceLabel: standardShippingCents === 0 ? "Free" : formatCents(standardShippingCents),
    },
    { key: "express", label: "Express Delivery (1–2 days)", priceLabel: formatCents(expressShippingCents) },
  ];

  return (
    <div className="flex-1 min-w-70 flex flex-col gap-7" style={{ flexBasis: "480px" }}>
      <div>
        <div className="text-sm font-extrabold mb-3.5">Contact</div>
        <div className="flex gap-3 flex-wrap">
          <input placeholder="Email address" className={`flex-1 min-w-55 ${inputClass}`} />
          <input placeholder="Phone number" className={`flex-1 min-w-55 ${inputClass}`} />
        </div>
      </div>

      <div>
        <div className="text-sm font-extrabold mb-3.5">Shipping Address</div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 flex-wrap">
            <input placeholder="First name" className={`flex-1 min-w-40 ${inputClass}`} />
            <input placeholder="Last name" className={`flex-1 min-w-40 ${inputClass}`} />
          </div>
          <input placeholder="Street address" className={inputClass} />
          <div className="flex gap-3 flex-wrap">
            <input placeholder="City" className={`flex-1 min-w-35 ${inputClass}`} />
            <input placeholder="ZIP code" className={`flex-1 min-w-30 ${inputClass}`} />
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm font-extrabold mb-3.5">Delivery Method</div>
        <div className="flex flex-col gap-2.5">
          {deliveryOptions.map((option) => {
            const selected = deliveryMethod === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelectDelivery(option.key)}
                className="flex items-center justify-between rounded-[3px] px-4 py-3.25 border-[1.5px]"
                style={{ borderColor: selected ? "var(--accent)" : "var(--line)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full border-[1.5px] flex-none flex items-center justify-center"
                    style={{ borderColor: selected ? "var(--accent)" : "oklch(80% 0.01 50)" }}
                  >
                    {selected && <span className="w-2 h-2 rounded-full bg-accent" />}
                  </span>
                  <span className="text-[13.5px] font-semibold">{option.label}</span>
                </div>
                <span className="text-[13.5px] font-bold">{option.priceLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-sm font-extrabold mb-3.5">Payment Method</div>
        <div className="flex flex-col gap-2.5">
          {PAYMENT_OPTIONS.map((option) => {
            const selected = paymentMethod === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelectPayment(option.key)}
                className="flex items-center gap-3 rounded-[3px] px-4 py-3.25 border-[1.5px]"
                style={{ borderColor: selected ? "var(--accent)" : "var(--line)" }}
              >
                <span
                  className="w-4 h-4 rounded-full border-[1.5px] flex-none flex items-center justify-center"
                  style={{ borderColor: selected ? "var(--accent)" : "oklch(80% 0.01 50)" }}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-accent" />}
                </span>
                <span className="text-[13.5px] font-semibold">{option.label}</span>
              </button>
            );
          })}
          {paymentMethod === "card" && (
            <div className="flex gap-3 flex-wrap mt-1">
              <input placeholder="Card number" className={`flex-1 min-w-50 ${inputClass}`} />
              <input placeholder="MM/YY" className={`w-22.5 ${inputClass}`} />
              <input placeholder="CVC" className={`w-20 ${inputClass}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
