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

type CheckoutLine = { productId: string; size: string; color?: string; quantity: number };
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
    const color = String(raw?.color || "").trim() || undefined;
    const quantity = Number(raw?.quantity ?? 1);
    if (!productId || !size || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) continue;
    const key = `${productId}::${color?.toLowerCase() || ""}::${size}`;
    const current = merged.get(key);
    merged.set(key, { productId, size, color, quantity: Math.min(20, (current?.quantity || 0) + quantity) });
  }
  return Array.from(merged.values());
}

export async function POST(req: Request) {
  const diagnostic = new URL(req.url).searchParams.get("diagnostic") === "1";
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
      const variants = parsed.metadata.colorVariants || [];
      const requestedColor = line.color?.trim().toLowerCase();
      const selectedVariant = variants.length
        ? (requestedColor
          ? variants.find((variant) => variant.name.trim().toLowerCase() === requestedColor)
          : variants.find((variant) => variant.name.trim().toLowerCase() === "black") || variants[0])
        : undefined;
      // Older cart entries may carry the default "Black" value even when this
      // product has no Black variant. Treat that value as an omitted optional
      // color instead of blocking a valid COD order.
      const ignoredLegacyColor = Boolean(variants.length && requestedColor === "black" && !selectedVariant);
      if (variants.length && !selectedVariant && !ignoredLegacyColor) return NextResponse.json({ error: `${product.title} does not offer color ${line.color}.` }, { status: 400 });
      const effectiveVariant = selectedVariant || undefined;
      const availableSizes = normalizeProductSizes(effectiveVariant?.sizes?.length ? effectiveVariant.sizes : parsed.metadata.sizes);
      if (!availableSizes.includes(line.size)) return NextResponse.json({ error: `${product.title} does not offer size ${line.size}${effectiveVariant ? ` in ${effectiveVariant.name}` : ""}.` }, { status: 400 });
      if (effectiveVariant?.stockBySize && effectiveVariant.stockBySize[line.size] === 0) return NextResponse.json({ error: `${product.title} is sold out in ${effectiveVariant.name}, size ${line.size}.` }, { status: 400 });
      const normalizedLine: CheckoutLine = { ...line, color: effectiveVariant?.name || (ignoredLegacyColor ? undefined : line.color) };
      const orderCurrency = (requestedCurrency || product.currency) as Currency;
      const regionalPrice = parsed.metadata.regionalPrices?.[orderCurrency as "USD" | "PKR" | "INR"];
      const unitPriceInCents = regionalPrice !== undefined ? Math.round(regionalPrice * 100) : requestedCurrency ? null : product.priceInCents;
      if (unitPriceInCents === null || !Number.isFinite(unitPriceInCents) || unitPriceInCents <= 0) return NextResponse.json({ error: `No owner-entered ${orderCurrency} price is configured for ${product.title}.` }, { status: 400 });
      pricedLines.push({ product, parsed, ...normalizedLine, unitPriceInCents, totalAmountInCents: unitPriceInCents * normalizedLine.quantity });
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
      const optionalOrderColumns = new Set(
        (await tx.$queryRawUnsafe<Array<{ column_name: string }>>(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'Order'
            AND column_name IN ('city', 'country', 'size', 'productColor')
        `)).map(({ column_name }) => column_name),
      );

      for (let index = 0; index < pricedLines.length; index += 1) {
        const line = pricedLines[index];
        const legacyTitle = line.color ? `${line.product.title} · Color: ${line.color}` : line.product.title;
        const values: unknown[] = [];
        const addValue = (value: unknown) => {
          values.push(value);
          return `$${values.length}`;
        };
        const columns = [
          'id', 'orderReference', 'fullName', 'email', 'phone', 'address',
          'productId', 'productSku', 'productTitle', 'unitPriceInCents', 'quantity',
          'totalAmountInCents', 'currency', 'paymentMethod', 'paymentStatus',
          'orderStatus', 'confirmedAt', 'expiresAt',
        ];
        const placeholders = [
          addValue(randomUUID()), addValue(`${groupReference}-${index + 1}`),
          addValue(String(fullName).trim()), addValue(String(email).trim()),
          addValue(String(phone).trim()), addValue(String(address).trim()),
          addValue(line.product.id), addValue(line.product.sku),
          addValue(optionalOrderColumns.has('productColor') ? line.product.title : legacyTitle),
          addValue(line.unitPriceInCents), addValue(line.quantity),
          addValue(line.totalAmountInCents), `${addValue(orderCurrency)}::"Currency"`,
          `${addValue(selectedPaymentMethod)}::"PaymentMethod"`,
          `${addValue(selectedPaymentMethod === "CARD" ? "PENDING_PAYMENT" : "UNPAID_COD")}::"PaymentStatus"`,
          `${addValue(selectedPaymentMethod === "COD" ? "CONFIRMED" : "RESERVED")}::"OrderStatus"`,
          addValue(selectedPaymentMethod === "COD" ? new Date() : null),
          addValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        ];
        const optionalValues: Record<string, unknown> = {
          city: String(city).trim(), country: normalizedCountry, size: line.size, productColor: line.color || null,
        };
        for (const column of ['city', 'country', 'size', 'productColor']) {
          if (!optionalOrderColumns.has(column)) continue;
          columns.push(column);
          placeholders.push(addValue(optionalValues[column]));
        }
        await tx.$executeRawUnsafe(
          `INSERT INTO "Order" (${columns.map((column) => `"${column}"`).join(', ')}) VALUES (${placeholders.join(', ')})`,
          ...values,
        );
        createdOrders.push({ id: values[0], orderReference: values[1] });
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
                description: line.color ? `${line.parsed.description || ""}${line.parsed.description ? " · " : ""}Color: ${line.color}` : line.parsed.description || "",
                images: line.color
                  ? line.parsed.metadata.colorVariants?.find((variant) => variant.name === line.color)?.media?.filter((media) => media.type === "image").slice(0, 8).map((media) => media.url) || []
                  : line.product.imageUrl ? [line.product.imageUrl] : line.parsed.metadata.media?.filter((media) => media.type === "image").slice(0, 8).map((media) => media.url) || [],
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
    return NextResponse.json(
      { error: diagnostic ? String(err?.message || err) : "We could not place your order right now. Please try again." },
      { status: 500 },
    );
  }
}
