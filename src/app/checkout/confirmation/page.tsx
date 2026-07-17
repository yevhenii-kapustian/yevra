import { getStripe } from "@/utils/stripe/client";
import { createAdminClient } from "@/utils/supabase/admin-client";
import { createClient } from "@/utils/supabase/server-client";
import OrderConfirmation from "@/components/OrderConfirmation";
import CreateAccountPrompt from "@/components/CreateAccountPrompt";
import type { ShippingAddress } from "@/lib/checkout-types";

export const dynamic = "force-dynamic";

function NotFoundMessage() {
  return (
    <div className="text-center py-20 max-w-105 mx-auto">
      <div className="text-2xl font-extrabold mb-2.5">We couldn&apos;t find that order</div>
      <p className="text-sm text-muted">
        If you just completed a payment, check your email for a confirmation — otherwise this link may have expired.
      </p>
    </div>
  );
}

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutConfirmationPage({ searchParams }: PageProps) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) return <NotFoundMessage />;

  let orderId: string | undefined;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    orderId = session.metadata?.order_id;
  } catch {
    return <NotFoundMessage />;
  }
  if (!orderId) return <NotFoundMessage />;

  // Guest orders have no RLS access via the anon key, so this must use the
  // admin client — access is gated on knowing the unguessable Stripe session
  // id (retrieved above), not on auth.
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, order_number, email, subtotal_cents, shipping_cents, total_cents, shipping_address, user_id, order_items(id, title, variant_title, quantity, line_total_cents, variant_id)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return <NotFoundMessage />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showAccountPrompt = !order.user_id && !user;
  const purchasedVariantIds = order.order_items.map((i) => i.variant_id).filter((v): v is string => v !== null);

  return (
    <OrderConfirmation
      order={{ ...order, shipping_address: order.shipping_address as unknown as ShippingAddress }}
      purchasedVariantIds={purchasedVariantIds}
      accountPrompt={showAccountPrompt ? <CreateAccountPrompt orderId={order.id} email={order.email} /> : null}
    />
  );
}
