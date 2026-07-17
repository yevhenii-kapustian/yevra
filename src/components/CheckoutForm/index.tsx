"use client";

import { formatCents } from "@/lib/products";
import { useAuth } from "@/context/AuthContext";

type DeliveryMethod = "standard" | "express";

type CheckoutFormProps = {
  deliveryMethod: DeliveryMethod;
  onSelectDelivery: (method: DeliveryMethod) => void;
  standardShippingCents: number;
  expressShippingCents: number;
};

const inputClass = "border border-line px-3.5 py-3 text-[13.5px] rounded-sm";

export default function CheckoutForm({
  deliveryMethod,
  onSelectDelivery,
  standardShippingCents,
  expressShippingCents,
}: CheckoutFormProps) {
  const { user } = useAuth();

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
          <input
            name="email"
            type="email"
            placeholder="Email address"
            defaultValue={user?.email ?? ""}
            required
            className={`flex-1 min-w-55 ${inputClass}`}
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone number"
            required
            className={`flex-1 min-w-55 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <div className="text-sm font-extrabold mb-3.5">Shipping Address</div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 flex-wrap">
            <input name="firstName" placeholder="First name" required className={`flex-1 min-w-40 ${inputClass}`} />
            <input name="lastName" placeholder="Last name" required className={`flex-1 min-w-40 ${inputClass}`} />
          </div>
          <input name="line1" placeholder="Street address" required className={inputClass} />
          <input name="line2" placeholder="Apt, suite, etc. (optional)" className={inputClass} />
          <div className="flex gap-3 flex-wrap">
            <input name="city" placeholder="City" required className={`flex-1 min-w-35 ${inputClass}`} />
            <input name="state" placeholder="State" required className={`flex-1 min-w-25 ${inputClass}`} />
            <input name="postalCode" placeholder="ZIP code" required className={`flex-1 min-w-30 ${inputClass}`} />
          </div>
          <input type="hidden" name="country" value="US" />
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
        <div className="text-sm font-extrabold mb-3.5">Payment</div>
        <p className="text-[13px] text-muted">
          You&apos;ll securely enter your card details on the next step.
        </p>
      </div>
    </div>
  );
}
