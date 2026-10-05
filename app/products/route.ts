import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializeProduct, type RegionalPrices } from "@/lib/product-meta";
import { currencyFromRequest, type DisplayCurrency } from "@/lib/currency";

export const dynamic = "force-dynamic";

function selectedPrice(product: { priceInCents: number; regionalPrices?: RegionalPrices }, currency: DisplayCurrency) {
  const regional = product.regionalPrices?.[currency];
  return regional && regional > 0 ? regional : product.priceInCents / 100;
}

export async function GET(req: Request) {
  try {
    const currency = currencyFromRequest(req);
    const products = await prisma.product.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } });
    const items = products.map((rawProduct) => {
      const product = serializeProduct(rawProduct);
      return {
        ...product,
        price: selectedPrice(product, currency),
        currency,
        prices: product.regionalPrices,
      };
    });
    return NextResponse.json({ success: true, currency, products: items });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
