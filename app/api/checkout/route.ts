import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decodeProductDescription, normalizeProductSizes } from "@/lib/product-meta";
// @ts-ignore
import type { Currency, PaymentMethod, OrderStatus, PaymentStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import Stripe from "stripe";

let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
  return stripe;
};

export const dynamic = "force-dynamic";

type CheckoutLine = { productId: string; size: string; quantity: number };
type PricedLine = CheckoutLine & {
  product: any;
  parsed: ReturnType<typeof decodeProductDescription>;
  unitPriceInCents: number;
  totalAmountInCents: number;
};

function parseCheckoutLines(body: any): CheckoutLine[] {
  const source = Array.isArray(body.items) && body.items.length
    ? body.items
    : [{ productId: body.productId, size: body.size, quantity: body.quantity ?? 1 }];
  const merged = new Map<string, CheckoutLine>();
  for (const raw of source) {
    const productId = String(raw?.productId || "").trim();
    const size = String(raw?.size || "").trim().toUpperCase();
    const quantity = Number(raw?.quantity ?? 1);
    if (!productId || !size || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) continue;
    const key = `${productId}::${size}`;
    const current = merged.get(key);
    merged.set(key, { productId, size, quantity: Math.min(20, (current?.quantity || 0) + quantity) });
  }
  return Array.from(merged.values());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, address, city, country, currency, paymentMethod: requestedPaymentMethod, useStripe = false } = body;
    const lines = parseCheckoutLines(body);

    if (!fullName || !email || !phone || !address || !city || !country || !lines.length) {
      return NextResponse.json({ error: "Missing required checkout fields or cart items." }, { status: 400 });
    }

    const normalizedCountry = String(country).trim();
    const isPakistan = normalizedCountry.toLowerCase() === "pakistan";
    const selectedPaymentMethod = isPakistan ? "COD" : "CARD";
    const requestedPayment = String(requestedPaymentMethod || (useStripe ? "CARD" : "COD")).trim().toUpperCase();
    if (isPakistan && requestedPayment === "CARD") return NextResponse.json({ error: "Pakistan orders support Cash on Delivery only." }, { status: 400 });
    if (!isPakistan && requestedPayment === "COD") return NextResponse.json({ error: "Card payment is required for India and international delivery." }, { status: 400 });
    if (selectedPaymentMethod === "CARD" && !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Card payment is ready but not activated yet. Please try again after the payment provider is configured." }, { status: 503 });

    const requestedCurrency = typeof currency === "string" ? currency.toUpperCase() : undefined;
    const supportedCurrencies = new Set(["USD", "PKR", "INR"]);
    if (requestedCurrency && !supportedCurrencies.has(requestedCurrency)) return NextResponse.json({ error: "Unsupported currency. Choose USD, PKR, or INR." }, { status: 400 });

    const products = await prisma.product.findMany({ where: { id: { in: Array.from(new Set(lines.map((line) => line.productId))) } } });
    const productById = new Map(products.map((product) => [product.id, product]));
    const pricedLines: PricedLine[] = [];

    for (const line of lines) {
      const product = productById.get(line.productId);
      if (!product) return NextResponse.json({ error: "One or more products are no longer available." }, { status: 404 });
      const parsed = decodeProductDescription(product.description);
      const availableSizes = normalizeProductSizes(parsed.metadata.sizes);
      if (!availableSizes.includes(line.size)) return NextResponse.json({ error: `${product.title} does not offer size ${line.size}.` }, { status: 400 });
      const orderCurrency = (requestedCurrency || product.currency) as Currency;
      const regionalPrice = parsed.metadata.regionalPrices?.[orderCurrency as "USD" | "PKR" | "INR"];
      const unitPriceInCents = regionalPrice !== undefined ? Math.round(regionalPrice * 100) : requestedCurrency ? null : product.priceInCents;
      if (unitPriceInCents === null || !Number.isFinite(unitPriceInCents) || unitPriceInCents <= 0) return NextResponse.json({ error: `No owner-entered ${orderCurrency} price is configured for ${product.title}.` }, { status: 400 });
      pricedLines.push({ product, parsed, ...line, unitPriceInCents, totalAmountInCents: unitPriceInCents * line.quantity });
    }

    const stockByProduct = new Map<string, number>();
    for (const line of pricedLines) stockByProduct.set(line.productId, (stockByProduct.get(line.productId) || 0) + line.quantity);
    for (const [productId, quantity] of Array.from(stockByProduct.entries())) {
      const product = productById.get(productId);
      if (!product || product.stockQuantity < quantity) return NextResponse.json({ error: `Insufficient stock for ${product?.title || "one of your selected products"}.` }, { status: 400 });
    }

    const orderCurrency = (requestedCurrency || pricedLines[0].product.currency) as Currency;
    const totalAmountInCents = pricedLines.reduce((sum, line) => sum + line.totalAmountInCents, 0);
    const groupReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let orders: any[] = [];

    orders = await prisma.$transaction(async (tx) => {
      const createdOrders = [];
      for (let index = 0; index < pricedLines.length; index += 1) {
        const line = pricedLines[index];
        createdOrders.push(await tx.order.create({
          data: {
            id: randomUUID(),
            orderReference: `${groupReference}-${index + 1}`,
            fullName: String(fullName).trim(),
            email: String(email).trim(),
            phone: String(phone).trim(),
            address: String(address).trim(),
            city: String(city).trim(),
            country: normalizedCountry,
            size: line.size,
            productId: line.product.id,
            productSku: line.product.sku,
            productTitle: line.product.title,
            unitPriceInCents: line.unitPriceInCents,
            quantity: line.quantity,
            totalAmountInCents: line.totalAmountInCents,
            currency: orderCurrency,
            paymentMethod: selectedPaymentMethod as PaymentMethod,
            paymentStatus: (selectedPaymentMethod === "CARD" ? "PENDING_PAYMENT" : "UNPAID_COD") as PaymentStatus,
            orderStatus: "RESERVED" as OrderStatus,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        }));
      }
      for (const [productId, quantity] of Array.from(stockByProduct.entries())) {
        const currentProduct = await tx.product.findUnique({ where: { id: productId } });
        if (!currentProduct || currentProduct.stockQuantity < quantity) throw new Error("INSUFFICIENT_STOCK");
        await tx.product.update({ where: { id: productId }, data: { stockQuantity: { decrement: quantity } } });
      }
      return createdOrders;
    });

    if (selectedPaymentMethod === "CARD") {
      try {
        const stripeInstance = getStripe();
        if (!stripeInstance) throw new Error("Stripe is not configured");
        const session = await stripeInstance.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: pricedLines.map((line) => ({
            price_data: {
              currency: orderCurrency.toLowerCase(),
              product_data: {
                name: line.product.title,
                description: line.parsed.description || "",
                images: line.product.imageUrl ? [line.product.imageUrl] : line.parsed.metadata.media?.filter((media) => media.type === "image").slice(0, 8).map((media) => media.url) || [],
              },
              unit_amount: line.unitPriceInCents,
            },
            quantity: line.quantity,
          })),
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout?payment=failed&currency=${orderCurrency}`,
          customer_email: email,
          metadata: {
            order_id: orders[0].id,
            order_ids: orders.map((order) => order.id).join(","),
            order_reference: groupReference,
          },
        });
        await prisma.order.update({ where: { id: orders[0].id }, data: { stripeIntent: session.id } });
        return NextResponse.json({ success: true, checkoutUrl: session.url, orderId: orders[0].id, orderIds: orders.map((order) => order.id), orderReference: groupReference, itemCount: pricedLines.length });
      } catch (stripeErr) {
        console.error("Stripe session creation failed:", stripeErr);
        try {
          await prisma.$transaction(async (tx) => {
            await tx.order.updateMany({ where: { id: { in: orders.map((order) => order.id) } }, data: { orderStatus: "CANCELLED" as OrderStatus, paymentStatus: "FAILED" as PaymentStatus } });
            for (const [productId, quantity] of Array.from(stockByProduct.entries())) await tx.product.update({ where: { id: productId }, data: { stockQuantity: { increment: quantity } } });
          });
        } catch (rollbackErr) {
          console.error("Failed to rollback card reservation:", rollbackErr);
        }
        return NextResponse.json({ error: "Failed to create payment session. No card was charged." }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Order placed successfully.", orderId: orders[0].id, orderIds: orders.map((order) => order.id), orderReference: groupReference, itemCount: pricedLines.length });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message || "Failed to process checkout." }, { status: 500 });
  }
}
