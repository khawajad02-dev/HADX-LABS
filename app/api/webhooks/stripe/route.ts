import { NextResponse } from "next/server";
import Stripe from "stripe";
import type { Stripe as StripeType } from "stripe";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { getHADXOrderEmailHTML } from "@/lib/email-template";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeClient = new Stripe(apiKey);
  }
  return stripeClient;
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (!orderId) {
        console.warn("Checkout session completed but no order_id in metadata");
        return NextResponse.json({ received: true });
      }

      // Update order status to paid
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "COMPLETED",
          orderStatus: "CONFIRMED",
          confirmedAt: new Date(),
        },
        include: {
          product: true,
        },
      });

      // Send confirmation email via Resend
      try {
        const emailHtml = getHADXOrderEmailHTML({
          orderReference: order.orderReference,
          fullName: order.fullName,
          productTitle: order.productTitle,
          quantity: order.quantity,
          unitPriceInCents: order.unitPriceInCents,
          totalAmountInCents: order.totalAmountInCents,
          orderId: order.id,
        });
        await resend.emails.send({
          from: "orders@hadx-labs.com",
          to: order.email,
          subject: `Order Confirmation #${order.orderReference}`,
          html: emailHtml,
        });
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
        // Don't fail the webhook if email fails
      }

      return NextResponse.json({ received: true });
    }

    // Handle payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Payment intent succeeded:", paymentIntent.id);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


