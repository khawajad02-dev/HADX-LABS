"use client";

import { useState } from "react";
import { CheckoutVideoModal, type CheckoutState } from "@/components/CheckoutVideoModal";

export default function PaymentResultClient({
  state,
  orderId,
}: {
  state: Exclude<CheckoutState, null>;
  orderId?: string;
}) {
  const [modalState, setModalState] = useState<CheckoutState>(state);

  return (
    <>
      <main className="min-h-screen bg-transparent px-6 pt-36 text-center text-white">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-200/80">
          {state === "order_confirmed" ? "Payment confirmed" : "Payment could not be confirmed"}
        </p>
        <a
          href="/catalog#catalog"
          className="liquid-ui mt-8 inline-flex rounded-full px-5 py-3 text-xs font-mono uppercase tracking-widest text-amber-100"
        >
          Return to catalog
        </a>
      </main>
      <CheckoutVideoModal
        state={modalState}
        orderId={orderId}
        onClose={() => setModalState(null)}
        onRetry={() => setModalState(null)}
      />
    </>
  );
}
