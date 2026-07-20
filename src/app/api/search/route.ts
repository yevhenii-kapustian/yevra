import { NextResponse, type NextRequest } from "next/server";
import { searchProducts } from "@/lib/products-data";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchProducts(query);
  return NextResponse.json({ results });
}
