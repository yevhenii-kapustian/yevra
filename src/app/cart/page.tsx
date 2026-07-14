import CartList from "@/components/CartList";
import CartSummary from "@/components/CartSummary";

export default function CartPage() {
  return (
    <div className="px-4 pt-7 pb-18 sm:px-8 lg:px-12 max-w-275 mx-auto">
      <h1 className="text-[28px] font-extrabold mb-6">Your Cart</h1>
      <div className="flex gap-10 flex-wrap items-start">
        <CartList />
        <CartSummary />
      </div>
    </div>
  );
}
