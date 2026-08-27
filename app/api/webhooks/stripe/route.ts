import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { getHADXOrderEmailHTML } from "@/lib/email-template";

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not set");
    stripeClient = new Stripe(apiKey);
  }
  return stripeClient;
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadataIds = session.metadata?.order_ids?.split(",").map((id) => id.trim()).filter(Boolean) || [];
      const orderIds = metadataIds.length ? metadataIds : session.metadata?.order_id ? [session.metadata.order_id] : [];
      if (!orderIds.length) {
        console.warn("Checkout session completed but no order IDs in metadata");
        return NextResponse.json({ received: true });
      }

      await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: { paymentStatus: "COMPLETED", orderStatus: "CONFIRMED", confirmedAt: new Date() },
      });
      const orders = await prisma.order.findMany({ where: { id: { in: orderIds } }, include: { product: true } });

      for (const order of orders) {
        try {
          const emailHtml = getHADXOrderEmailHTML({
            orderReference: session.metadata?.order_reference || order.orderReference,
            fullName: order.fullName,
            productTitle: order.productTitle,
            quantity: order.quantity,
            unitPriceInCents: order.unitPriceInCents,
            totalAmountInCents: order.totalAmountInCents,
            orderId: order.id,
          });
          await resend.emails.send({ from: "orders@hadx-labs.com", to: order.email, subject: `Order Confirmation #${session.metadata?.order_reference || order.orderReference}`, html: emailHtml });
        } catch (emailErr) {
          console.error("Failed to send confirmation email:", emailErr);
        }
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === "payment_intent.succeeded") {
      console.log("Payment intent succeeded:", (event.data.object as Stripe.PaymentIntent).id);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
