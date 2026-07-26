'use client';

import { useState } from 'react';
import { CheckoutVideoModal, CheckoutState } from './CheckoutVideoModal';

export default function CheckoutPage() {
  const [modalState, setModalState] = useState<CheckoutState>(null);
  const [activeOrderId, setActiveOrderId] = useState<string>('HADX-984210');

  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-12 flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
          HADX LABS Checkout Test Suite
        </h1>
        <p className="text-sm text-neutral-400">
          Click any button below to trigger the respective 3D Video Modal UX.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
        <button
          onClick={() => setModalState('payment_failed')}
          className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/50 hover:border-red-500 transition-all font-mono text-xs text-center"
        >
          Payment Failed
        </button>

        <button
          onClick={() => setModalState('network_error')}
          className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:bg-amber-900/50 hover:border-amber-500 transition-all font-mono text-xs text-center"
        >
          Network Error
        </button>

        <button
          onClick={() => setModalState('timeout')}
          className="p-4 rounded-xl bg-orange-950/40 border border-orange-500/30 text-orange-300 hover:bg-orange-900/50 hover:border-orange-500 transition-all font-mono text-xs text-center"
        >
          Session Timeout
        </button>

        <button
          onClick={() => {
            setActiveOrderId('HADX-' + Math.floor(100000 + Math.random() * 900000));
            setModalState('order_confirmed');
          }}
          className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-500 transition-all font-mono text-xs text-center"
        >
          Order Confirmed
        </button>
      </div>

      <CheckoutVideoModal
        state={modalState}
        orderId={activeOrderId}
        onClose={() => setModalState(null)}
        onRetry={() => {
          console.log('Retrying state:', modalState);
          setModalState(null);
        }}
      />
    </div>
  );
}
