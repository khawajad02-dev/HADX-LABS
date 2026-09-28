import Stripe from "stripe";
import type { Metadata } from "next";
import PaymentResultClient from "@/components/PaymentResultClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment Result | HADX LABS", robots: { index: false, follow: false } };

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  return secretKey ? new Stripe(secretKey) : null;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id?.trim();
  const stripe = getStripe();

  if (!sessionId || !stripe) {
    return <PaymentResultClient state="payment_failed" />;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";

    return (
      <PaymentResultClient
        state={paid ? "order_confirmed" : "payment_failed"}
        orderId={session.metadata?.order_id}
      />
    );
  } catch {
    return <PaymentResultClient state="payment_failed" />;
  }
}
