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
