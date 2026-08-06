'use client';

import { useState } from 'react';
import { CheckoutVideoModal, CheckoutState } from './CheckoutVideoModal';

export default function CheckoutPage({ 
  items: initialItems = [], 
  total: initialTotal = 0 
}: { 
  items?: any[], 
  total?: number 
}) {
  const [modalState, setModalState] = useState<CheckoutState>(null);
  const [activeOrderId, setActiveOrderId] = useState<string>('HADX-984210');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  // Example Cart Items (In real app, fetch from cart state/context)
  const cartItems = initialItems.length > 0 ? initialItems : [
    { id: 'prod-001', name: 'HADX Obsidian Hoodie', price: 120, quantity: 1 },
  ];
  const totalAmount = initialTotal > 0 ? initialTotal : cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Live Checkout Execution Handler
  const handleRealCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!cartItems.length || !cartItems[0]?.id) {
      alert("System Error: Your loadout is empty.");
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city) {
      alert("Validation Error: All fields are required.");
      return;
    }

    setIsSubmitting(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout rule

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          productId: cartItems[0]?.id || '',
          quantity: cartItems[0]?.quantity || 1,
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.address}, ${formData.city}`,
          useStripe: false, // Default to COD as per spec unless specified
        }),
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (res.ok && data.success) {
        setActiveOrderId(data.orderId || `HADX-${Math.floor(100000 + Math.random() * 900000)}`);
        setModalState('order_confirmed');
      } else {
        console.error('Checkout failed:', data.error);
        setModalState('payment_failed');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setModalState('timeout');
      } else {
        setModalState('network_error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 sm:p-12 flex flex-col items-center justify-center space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-2 max-w-lg">
        <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500/80 uppercase block">
          [ SYSTEM :: CHECKOUT GATEWAY ]
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
          HADX LABS Secure Checkout
        </h1>
      </div>

      {/* Real Form & Order Summary Container */}
      <div className="w-full max-w-xl bg-neutral-950/80 border border-neutral-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-400 border-b border-neutral-800 pb-3">
          // Shipping Details
        </h2>

        <form onSubmit={handleRealCheckout} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-neutral-500 mb-1 uppercase">Full Name</label>
            <input
              type="text"
              required
              placeholder="Daud Commando"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1 uppercase">Email Address</label>
            <input
              type="email"
              required
              placeholder="daud@hadx.labs"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1 uppercase">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="+92 300 1234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-500 mb-1 uppercase">Address</label>
              <input
                type="text"
                required
                placeholder="Sector 7"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-neutral-500 mb-1 uppercase">City</label>
              <input
                type="text"
                required
                placeholder="Cyber City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Total & Submit */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase block">Total Amount</span>
              <span className="text-lg font-bold text-amber-400">${totalAmount.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] ${
                isSubmitting ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              {isSubmitting ? 'PROCESSING...' : 'EXECUTE ORDER'}
            </button>
          </div>
        </form>
      </div>

      {/* Developer Test Suite (For Testing All Video States directly) */}
      <div className="w-full max-w-xl bg-neutral-950/40 border border-dashed border-neutral-800 rounded-xl p-4 space-y-3">
        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest text-center">
          [ DEV DEBUG TOOL: OVERRIDE MODAL STATES ]
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setModalState('payment_failed')}
            className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/50 font-mono text-[10px]"
          >
            Payment Failed
          </button>
          <button
            onClick={() => setModalState('network_error')}
            className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-400 hover:bg-amber-900/50 font-mono text-[10px]"
          >
            Network Error
          </button>
          <button
            onClick={() => setModalState('timeout')}
            className="p-2 rounded-lg bg-orange-950/40 border border-orange-500/30 text-orange-400 hover:bg-orange-900/50 font-mono text-[10px]"
          >
            Session Timeout
          </button>
          <button
            onClick={() => {
              setActiveOrderId('HADX-' + Math.floor(100000 + Math.random() * 900000));
              setModalState('order_confirmed');
            }}
            className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50 font-mono text-[10px]"
          >
            Order Confirmed
          </button>
        </div>
      </div>

      {/* Video Modal Component */}
      <CheckoutVideoModal
        state={modalState}
        orderId={activeOrderId}
        onClose={() => setModalState(null)}
        onRetry={() => {
          setModalState(null);
        }}
      />
    </div>
  );
}
