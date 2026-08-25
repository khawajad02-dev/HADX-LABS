import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decodeProductDescription } from "@/lib/product-meta";
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
      quantity = 1,
      currency,
      useStripe = false
    } = body;

    if (!productId || !fullName || !email || !address) {
      return NextResponse.json(
        { error: "Missing required fields: productId, fullName, email, address" },
        { status: 400 }
      );
    }

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const parsedProduct = decodeProductDescription(product.description);
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

    if (product.stockQuantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const totalAmountInCents = unitPriceInCents * quantity;
    const orderId = randomUUID();
    const orderReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order in database
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          id: orderId,
          orderReference,
          fullName,
          email,
          phone: phone || "",
          address,
          productId: product.id,
          productSku: product.sku,
          productTitle: product.title,
          unitPriceInCents,
          quantity,
          totalAmountInCents,
          currency: orderCurrency,
          paymentMethod: (useStripe ? "CARD" : "COD") as PaymentMethod,
          paymentStatus: (useStripe ? "PENDING_PAYMENT" : "UNPAID_COD") as PaymentStatus,
          orderStatus: "RESERVED" as OrderStatus,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Reserve stock with race condition prevention
      const currentProduct = await tx.product.findUnique({ where: { id: product.id } });
      if (!currentProduct || currentProduct.stockQuantity < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: {
            decrement: quantity,
          },
        },
      });

      return newOrder;
    });

    // If using Stripe, create checkout session
    if (useStripe && process.env.STRIPE_SECRET_KEY) {
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
              quantity,
            },
          ],
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout`,
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
        return NextResponse.json(
          { error: "Failed to create payment session" },
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
