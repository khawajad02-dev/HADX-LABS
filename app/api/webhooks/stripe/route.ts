import { NextResponse } from "next/server";
import Stripe from "stripe";
import type { Stripe as StripeType } from "stripe";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

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
          confirmedAt: new Date(),
        },
        include: {
          product: true,
        },
      });

      // Send confirmation email via Resend
      try {
        await resend.emails.send({
          from: "orders@hadx-labs.com",
          to: order.email,
          subject: `Order Confirmation #${order.id}`,
          html: generateOrderReceiptHTML(order),
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

function generateOrderReceiptHTML(order: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; color: #000; }
          .order-details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; }
          .items { margin: 20px 0; }
          .item { padding: 10px; background-color: #f9f9f9; margin: 10px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .download-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HADX LABS</h1>
            <p>Order Confirmation</p>
          </div>
          
          <div class="order-details">
            <div class="detail-row">
              <span class="detail-label">Order ID:</span>
              <span>${order.orderReference}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span>${new Date().toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Customer:</span>
              <span>${order.fullName}</span>
            </div>
          </div>

          <div class="items">
            <h2>Items Purchased</h2>
            <div class="item">
              <strong>${order.productTitle}</strong><br>
              Quantity: ${order.quantity}<br>
              Price: $${(order.unitPriceInCents / 100).toFixed(2)}
            </div>
          </div>

          <div class="detail-row" style="font-size: 16px; font-weight: bold;">
            <span>Total:</span>
            <span>$${(order.totalAmountInCents / 100).toFixed(2)}</span>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/download/${order.id}" class="download-link">
            Download Your Asset
          </a>

          <div class="footer">
            <p>&copy; 2024 HADX LABS. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
