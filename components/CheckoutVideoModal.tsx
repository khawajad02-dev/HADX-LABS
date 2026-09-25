"use client";
import type { ReactNode } from "react";
export type CheckoutState = "order_confirmed" | "payment_failed" | "network_error" | "timeout" | null;
type Props = { state: CheckoutState; orderId: string; onClose: () => void; onRetry: () => void };
const copy: Record<Exclude<CheckoutState, null>, { title: string; body: ReactNode; action: string }> = {
  order_confirmed: { title: "ORDER CONFIRMED", body: "Your COD order has been received.", action: "CLOSE" },
  payment_failed: { title: "ORDER FAILED", body: "We could not create the order. Please verify your details and try again.", action: "TRY AGAIN" },
  network_error: { title: "NETWORK ERROR", body: "The checkout service could not be reached.", action: "TRY AGAIN" },
  timeout: { title: "SESSION TIMEOUT", body: "The checkout request timed out. No payment was taken.", action: "TRY AGAIN" },
};
export function CheckoutVideoModal({ state, orderId, onClose, onRetry }: Props) {
  if (!state) return null;
  const item = copy[state];
  const body = typeof item.body === "string" ? item.body : <>{item.body}</>;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="checkout-result-title">
    <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-neutral-950 p-7 text-center shadow-[0_0_40px_rgba(245,158,11,.18)]">
      <p className="mb-3 font-mono text-[10px] tracking-[.3em] text-amber-400">[ SYSTEM :: COD STATUS ]</p>
      <h2 id="checkout-result-title" className="mb-4 text-2xl font-bold text-white">{item.title}</h2>
      <p className="mb-7 text-sm leading-6 text-neutral-300">{body} {state === "order_confirmed" ? <strong>{orderId}</strong> : null}</p>
      <button onClick={state === "order_confirmed" ? onClose : onRetry} className="rounded-xl bg-amber-500 px-6 py-3 font-mono text-xs font-bold tracking-widest text-black hover:bg-amber-400">{item.action}</button>
    </div>
  </div>;
}
