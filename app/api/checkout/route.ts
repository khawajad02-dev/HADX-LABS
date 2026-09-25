import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Import types from @prisma/client, fallback to any if generation fails during CI
import type { PaymentMethod, OrderStatus, PaymentStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any }) : null;

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
      color,
      size,
      useStripe = false
    } = body;

    const normalizedQuantity = Number(quantity);
    if (!productId || !fullName || !email || !phone || !address || !Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
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

    if (product.stockQuantity < normalizedQuantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const totalAmountInCents = product.priceInCents * normalizedQuantity;
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
          unitPriceInCents: product.priceInCents,
          quantity: normalizedQuantity,
          color: color || "Black",
          size: size || "M",
          totalAmountInCents,
          currency: product.currency,
          paymentMethod: (useStripe ? "CARD" : "COD") as PaymentMethod,
          paymentStatus: (useStripe ? "PENDING_PAYMENT" : "UNPAID_COD") as PaymentStatus,
          orderStatus: "RESERVED" as OrderStatus,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Reserve stock with race condition prevention
      const currentProduct = await tx.product.findUnique({ where: { id: product.id } });
      if (!currentProduct || currentProduct.stockQuantity < normalizedQuantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: {
            decrement: normalizedQuantity,
          },
        },
      });

      return newOrder;
    });

    // If using Stripe, create checkout session
    if (useStripe && stripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: product.currency.toLowerCase(),
                product_data: {
                  name: product.title,
                  description: product.description || "",
                  images: product.imageUrl ? [product.imageUrl] : [],
                },
                unit_amount: product.priceInCents,
              },
              quantity: normalizedQuantity,
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
