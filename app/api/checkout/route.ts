import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decodeProductDescription, normalizeProductSizes } from "@/lib/product-meta";
// Import types from @prisma/client, fallback to any if generation fails during CI
// Use type-only imports for Prisma enums to avoid issues during static analysis
/** 
 * Safely import Prisma enums. 
 * If Prisma client is not yet generated, these will fall back to 'any' via the ignore/fallback pattern.
 */
// @ts-ignore
import type { Currency, PaymentMethod, OrderStatus, PaymentStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import Stripe from 'stripe';

// Initialize Stripe lazily to avoid build-time errors when environment variables are missing
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    });
  }
  return stripe;
};

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      productId, 
      fullName, 
      email, 
      phone,
      address,
      city,
      country,
      size,
      quantity = 1,
      currency,
      paymentMethod: requestedPaymentMethod,
      useStripe = false
    } = body;

    if (!productId || !fullName || !email || !phone || !address || !city || !country || !size) {
      return NextResponse.json(
        { error: "Missing required fields: productId, fullName, email, phone, address, city, country, size" },
        { status: 400 }
      );
    }

    const normalizedCountry = String(country).trim();
    const isPakistan = normalizedCountry.toLowerCase() === "pakistan";
    const selectedPaymentMethod = isPakistan ? "COD" : "CARD";
    const requestedPayment = String(requestedPaymentMethod || (useStripe ? "CARD" : "COD")).trim().toUpperCase();
    if (isPakistan && requestedPayment === "CARD") {
      return NextResponse.json({ error: "Pakistan orders support Cash on Delivery only." }, { status: 400 });
    }
    if (!isPakistan && requestedPayment === "COD") {
      return NextResponse.json({ error: "Card payment is required for India and international delivery." }, { status: 400 });
    }
    if (selectedPaymentMethod === "CARD" && !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Card payment is ready but not activated yet. Please try again after the payment provider is configured." }, { status: 503 });
    }

    const requestedQuantity = Number(quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 20) {
      return NextResponse.json({ error: "Quantity must be a whole number between 1 and 20." }, { status: 400 });
    }

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const parsedProduct = decodeProductDescription(product.description);
    const availableSizes = normalizeProductSizes(parsedProduct.metadata.sizes);
    const selectedSize = String(size).trim().toUpperCase();
    if (!availableSizes.includes(selectedSize)) {
      return NextResponse.json({ error: `Invalid size. Choose one of: ${availableSizes.join(", ")}.` }, { status: 400 });
    }

    const requestedCurrency = typeof currency === "string" ? currency.toUpperCase() : undefined;
    const supportedCurrencies = new Set(["USD", "PKR", "INR"]);
    if (requestedCurrency && !supportedCurrencies.has(requestedCurrency)) {
      return NextResponse.json({ error: "Unsupported currency. Choose USD, PKR, or INR." }, { status: 400 });
    }

    const orderCurrency = (requestedCurrency || product.currency) as Currency;
    const regionalPrice = parsedProduct.metadata.regionalPrices?.[orderCurrency as "USD" | "PKR" | "INR"];
    const unitPriceInCents = regionalPrice !== undefined
      ? Math.round(regionalPrice * 100)
      : requestedCurrency
        ? null
        : product.priceInCents;

    if (unitPriceInCents === null || !Number.isFinite(unitPriceInCents) || unitPriceInCents <= 0) {
      return NextResponse.json({ error: `No owner-entered ${orderCurrency} price is configured for this product.` }, { status: 400 });
    }

    if (product.stockQuantity < requestedQuantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const totalAmountInCents = unitPriceInCents * requestedQuantity;
    const orderId = randomUUID();
    const orderReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order in database
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          orderReference,
          fullName: String(fullName).trim(),
          email: String(email).trim(),
          phone: String(phone).trim(),
          address: String(address).trim(),
          city: String(city).trim(),
          country: normalizedCountry,
          size: selectedSize,
          productId: product.id,
          productSku: product.sku,
          productTitle: product.title,
          unitPriceInCents,
          quantity: requestedQuantity,
          totalAmountInCents,
          currency: orderCurrency,
          paymentMethod: selectedPaymentMethod as PaymentMethod,
          paymentStatus: (selectedPaymentMethod === "CARD" ? "PENDING_PAYMENT" : "UNPAID_COD") as PaymentStatus,
          orderStatus: "RESERVED" as OrderStatus,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Reserve stock with race condition prevention
      const currentProduct = await tx.product.findUnique({ where: { id: product.id } });
      if (!currentProduct || currentProduct.stockQuantity < requestedQuantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: {
            decrement: requestedQuantity,
          },
        },
      });

      return newOrder;
    });

    // If using Stripe, create checkout session
    if (selectedPaymentMethod === "CARD") {
      try {
        const stripeInstance = getStripe();
        if (!stripeInstance) {
          throw new Error("Stripe is not configured");
        }
        const session = await stripeInstance.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: orderCurrency.toLowerCase(),
                product_data: {
                  name: product.title,
                  description: parsedProduct.description || "",
                  images: product.imageUrl ? [product.imageUrl] : parsedProduct.metadata.media?.filter((media) => media.type === "image").slice(0, 8).map((media) => media.url) || [],
                },
                unit_amount: unitPriceInCents,
              },
              quantity: requestedQuantity,
            },
          ],
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout?payment=failed&productId=${encodeURIComponent(product.id)}&currency=${orderCurrency}&size=${encodeURIComponent(selectedSize)}`,
          customer_email: email,
          metadata: {
            order_id: order.id,
            order_reference: order.orderReference,
          },
        });

        // Store Stripe intent ID
        await prisma.order.update({
          where: { id: order.id },
          data: { stripeIntent: session.id },
        });

        return NextResponse.json({
          success: true,
          checkoutUrl: session.url,
          orderId: order.id,
          orderReference: order.orderReference,
        });
      } catch (stripeErr: any) {
        console.error("Stripe session creation failed:", stripeErr);
        try {
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: order.id },
              data: { orderStatus: "CANCELLED" as OrderStatus, paymentStatus: "FAILED" as PaymentStatus },
            });
            await tx.product.update({
              where: { id: product.id },
              data: { stockQuantity: { increment: requestedQuantity } },
            });
          });
        } catch (rollbackErr) {
          console.error("Failed to rollback card reservation:", rollbackErr);
        }
        return NextResponse.json(
          { error: "Failed to create payment session. No card was charged." },
          { status: 500 }
        );
      }
    }

    // COD flow
    return NextResponse.json({
      success: true,
      message: "Order placed successfully.",
      orderId: order.id,
      orderReference: order.orderReference,
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process checkout." },
      { status: 500 }
    );
  }
}
