import type { ShippingAddress } from "@/lib/checkout-types";

const PRINTIFY_API_BASE = "https://api.printify.com/v1";

export type PrintifyOptionValue = {
  id: number;
  title: string;
};

export type PrintifyOption = {
  name: string;
  type: string;
  values: PrintifyOptionValue[];
};

export type PrintifyImage = {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
};

export type PrintifyVariant = {
  id: number;
  sku: string | null;
  price: number;
  title: string | null;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  options: number[];
};

export type PrintifyProduct = {
  id: string;
  title: string;
  description: string | null;
  options: PrintifyOption[];
  variants: PrintifyVariant[];
  images: PrintifyImage[];
  visible: boolean;
  created_at: string;
  updated_at: string;
};

type PrintifyProductsPage = {
  data: PrintifyProduct[];
  current_page: number;
  last_page: number;
};

// For "custom_integration" (manual/API) shops, Printify's dashboard puts a
// product into a locked "Publishing" state as soon as it's saved there, and
// expects the storefront that actually displays it to call this endpoint to
// release the lock. Without it the product stays locked (can't be edited/
// deleted/replaced in the Printify UI) indefinitely — there's no real sales
// channel to send an automatic confirmation back. Safe to call repeatedly;
// Printify returns 200 even if the lock is already released.
export async function markPublishingSucceeded(
  shopId: string,
  productId: string,
  token: string,
  externalUrl?: string
): Promise<void> {
  const res = await fetch(`${PRINTIFY_API_BASE}/shops/${shopId}/products/${productId}/publishing_succeeded.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external: { id: productId, handle: externalUrl ?? "" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Printify publishing_succeeded error ${res.status} for product ${productId}: ${body}`);
  }
}

export type PrintifyOrderLineItem = {
  product_id: string;
  variant_id: number;
  quantity: number;
};

export type PrintifyAddressTo = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  region?: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
};

// Shared by the Stripe webhook's initial order push and the returns flow's
// reprint action — both need the same ShippingAddress -> Printify shape.
export function toPrintifyAddress(address: ShippingAddress, email: string): PrintifyAddressTo {
  return {
    first_name: address.firstName,
    last_name: address.lastName,
    email,
    phone: address.phone,
    country: address.country,
    region: address.state,
    address1: address.line1,
    address2: address.line2 ?? undefined,
    city: address.city,
    zip: address.postalCode,
  };
}

// Submits a real production order for existing catalog products (not a
// custom-artwork upload). send_shipping_notification is deliberately false —
// Printify's own shipping emails would go out under Printify's name, which
// breaks the point of a white-labeled custom_integration storefront.
export async function createOrder(
  shopId: string,
  token: string,
  params: { externalId: string; lineItems: PrintifyOrderLineItem[]; addressTo: PrintifyAddressTo }
): Promise<{ id: string }> {
  const res = await fetch(`${PRINTIFY_API_BASE}/shops/${shopId}/orders.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: params.externalId,
      line_items: params.lineItems,
      address_to: params.addressTo,
      send_shipping_notification: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Printify create order error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function getShopProducts(shopId: string, token: string): Promise<PrintifyProduct[]> {
  const products: PrintifyProduct[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(`${PRINTIFY_API_BASE}/shops/${shopId}/products.json?page=${page}&limit=50`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Printify API error ${res.status}: ${body}`);
    }

    const json: PrintifyProductsPage = await res.json();
    products.push(...json.data);

    if (json.current_page >= json.last_page) break;
    page += 1;
  }

  return products;
}
