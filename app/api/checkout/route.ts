import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, OrderStatus, PaymentStatus } from "@prisma/client";
import { randomUUID } from "crypto";

let stripeClient: any = null;

function getStripe() {
  if (!stripeClient) {
    const Stripe = require("stripe");
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

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

    if (product.stockQuantity < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const totalAmountInCents = product.priceInCents * quantity;
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
          quantity,
          totalAmountInCents,
          currency: product.currency,
          paymentMethod: useStripe ? "CARD" : "COD",
          paymentStatus: useStripe ? PaymentStatus.PENDING_PAYMENT : PaymentStatus.PENDING_PAYMENT,
          orderStatus: OrderStatus.RESERVED,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Reserve stock
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
        const stripe = getStripe();
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
