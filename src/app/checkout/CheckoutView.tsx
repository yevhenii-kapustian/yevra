"use client";

import { useState } from "react";
import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSummary from "@/components/CheckoutSummary";
import OrderConfirmation from "@/components/OrderConfirmation";
import { useCart } from "@/context/CartContext";

type DeliveryMethod = "standard" | "express";
type PaymentMethod = "card" | "cod";

export default function CheckoutView() {
  const { shipping, clearCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const shippingCost = deliveryMethod === "express" ? 12 : shipping;

  const placeOrder = () => {
    setOrderNumber(String(Math.floor(10000 + Math.random() * 90000)));
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return <OrderConfirmation orderNumber={orderNumber} />;
  }

  return (
    <div>
      <h1 className="text-[28px] font-extrabold mb-6">Checkout</h1>
      <div className="flex gap-10 flex-wrap items-start">
        <CheckoutForm
          deliveryMethod={deliveryMethod}
          onSelectDelivery={setDeliveryMethod}
          paymentMethod={paymentMethod}
          onSelectPayment={setPaymentMethod}
        />
        <CheckoutSummary shippingCost={shippingCost} onPlaceOrder={placeOrder} />
      </div>
    </div>
  );
}
