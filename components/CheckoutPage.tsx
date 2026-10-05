'use client';

import { useState } from 'react';
function digits(value: string) { return value.replace(/\D/g, '').slice(0, 16); }
function formatCard(value: string) { return digits(value).replace(/(.{4})/g, '$1 ').trim(); }
function maskCard(value: string) { return Array.from({ length: 16 }, (_, index) => digits(value)[index] || '•').join('').replace(/(.{4})/g, '$1 ').trim(); }
function CardPreview({ name, number, expiry, cvv, flipped, amount }: { name: string; number: string; expiry: string; cvv: string; flipped: boolean; amount: string }) { const first = digits(number)[0]; const network = first === '4' ? 'VISA' : first === '5' ? 'MASTERCARD' : 'HADX PAY'; return <div className={`checkout-card-stage ${flipped ? 'is-flipped' : ''}`}><div className="checkout-card-flipper"><div className="checkout-card-face"><img src="/hadx-monogram-emitter-clean.png" alt="HADX" className="checkout-card-logo" /><span className="checkout-card-chip" /><div className="checkout-card-number">{maskCard(number)}</div><div className="checkout-card-bottomline"><strong>{name || 'YOUR NAME'}</strong><strong>{expiry || 'MM/YY'}</strong><b>{network}</b></div><span className="checkout-card-amount">{amount}</span></div><div className="checkout-card-face checkout-card-back"><div className="checkout-card-magnetic" /><div className="checkout-card-cvv-box">{cvv || '•••'}</div></div></div></div>; }
import { CheckoutVideoModal, CheckoutState } from './CheckoutVideoModal';
import CustomSelect from './CustomSelect';
import type { CartItem } from '@/lib/cart';
import { playCardFlipSound, pulseHaptic } from '@/lib/interaction-feedback';
import { useCart } from '@/components/CartProvider';

export default function CheckoutPage({ 
  items: initialItems = [], 
  initialCountry = '',
  onOrderComplete,
  onClearCart,
}: {
  items?: CartItem[],
  initialCountry?: string,
  onOrderComplete?: () => void,
  onClearCart?: () => void,
}) {
  const [modalState, setModalState] = useState<CheckoutState>(null);
  const [activeOrderId, setActiveOrderId] = useState<string>('HADX-984210');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineMessage, setInlineMessage] = useState('');
  const [focusedCardField, setFocusedCardField] = useState<'number' | 'expiry' | 'cvv' | null>(null);
  const { items: providerItems, increment, decrement, removeItem } = useCart();
  const [isProviderCheckout] = useState(() => initialItems.length > 0 && providerItems.length > 0);
  const [directItems, setDirectItems] = useState<CartItem[]>(initialItems);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: initialCountry, cardNumber: '', expiry: '', cvv: '',
  });
  const [otherCountry, setOtherCountry] = useState('');

  const cartItems = (isProviderCheckout ? providerItems : directItems) as CartItem[];
  const updateDirectItem = (key: string, action: 'increment' | 'decrement' | 'remove') => setDirectItems((current) => current.flatMap((item) => {
    if (item.key !== key) return [item];
    if (action === 'remove' || (action === 'decrement' && item.quantity <= 1)) return [];
    return [{ ...item, quantity: action === 'increment' ? Math.min(20, item.quantity + 1) : item.quantity - 1 }];
  }));
  const changeQuantity = (key: string, action: 'increment' | 'decrement' | 'remove') => {
    if (isProviderCheckout) {
      if (action === 'increment') increment(key);
      else if (action === 'decrement') decrement(key);
      else removeItem(key);
      return;
    }
    updateDirectItem(key, action);
  };
  const activeCurrency = cartItems[0]?.currency || 'USD';
  const currencySymbol = activeCurrency === 'PKR' ? 'PKR' : activeCurrency === 'INR' ? '₹' : '$';
  const isOtherCountry = formData.country.trim().toLowerCase() === 'other';
  const effectiveCountry = isOtherCountry ? otherCountry.trim() : formData.country.trim();
  const isPakistan = effectiveCountry.toLowerCase() === 'pakistan';
  const paymentMethod = effectiveCountry ? (isPakistan ? 'COD' : 'CARD') : '';
  const paymentLabel = paymentMethod === 'COD' ? 'Cash on delivery' : paymentMethod === 'CARD' ? 'Card payment' : 'Select country first';
  const isCardPayment = paymentMethod === 'CARD';
  const setCard = (key: 'cardNumber' | 'expiry' | 'cvv', value: string) => setFormData((current) => ({ ...current, [key]: value }));
  const totalAmount = cartItems.reduce((acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0), 0);

  // Live Checkout Execution Handler
  const handleRealCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!cartItems.length || !cartItems[0]?.productId) {
      alert("System Error: Your loadout is empty.");
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.city.trim() || !effectiveCountry || !cartItems.every((item) => item.productId && item.size)) {
      alert("Validation Error: All fields are required.");
      return;
    }

    setInlineMessage('');
    setIsSubmitting(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout rule

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          productId: cartItems[0]?.productId || '',
          quantity: cartItems[0]?.quantity || 1,
          items: cartItems.map((item) => ({ productId: item.productId, size: item.size, color: item.color, quantity: item.quantity })),
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: effectiveCountry,
          size: cartItems[0]?.size || '',
          currency: activeCurrency,
          paymentMethod,
          useStripe: paymentMethod === 'CARD',
        }),
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (res.status === 503) {
        setInlineMessage(data.error || 'Card payment is not activated yet.');
        setModalState('payment_failed');
        return;
      }

      if (res.ok && data.success) {
        if (paymentMethod === 'CARD' && data.checkoutUrl) {
          window.location.assign(data.checkoutUrl);
          return;
        }
        setActiveOrderId(data.orderId || `HADX-${Math.floor(100000 + Math.random() * 900000)}`);
        setModalState('order_confirmed');
      } else {
        console.error('Checkout failed:', data.error);
        if (paymentMethod === 'COD') {
          setInlineMessage(data.error || 'Cash on Delivery order could not be confirmed. Please review your details and try again.');
          return;
        }
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

  const closeModal = () => {
    const wasConfirmed = modalState === 'order_confirmed';
    setModalState(null);
    if (wasConfirmed) onOrderComplete?.();
  };

  return (
    <div className="checkout-page-shell relative min-h-screen bg-transparent text-white p-6 sm:p-12 flex flex-col items-center justify-center space-y-8">
      <div className="w-full max-w-xl flex justify-start">
        <a href="/catalog#catalog" className="liquid-ui checkout-back-link rounded-full px-4 py-2 text-[10px] font-mono uppercase tracking-widest">← Back to catalog</a>
      </div>

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
      <div className="checkout-glass-card liquid-panel w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <h2 className="checkout-section-label font-mono text-xs uppercase tracking-widest border-b border-neutral-800 pb-3">
          {"//"} Shipping Details
        </h2>

        <div className="liquid-panel checkout-subpanel space-y-3 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <span className="checkout-muted-label text-[10px] font-mono uppercase tracking-widest">Loadout [{cartItems.length} pieces]</span>
            <span className="checkout-muted-label text-[10px] font-mono uppercase tracking-widest">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} units</span>
          </div>
          {cartItems.length === 0 ? <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center"><p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-100/70">LOADOUT EMPTY</p><a href="/catalog#catalog" className="liquid-ui mt-4 inline-flex rounded-full px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-amber-100">BACK TO CATALOG</a></div> : cartItems.map((item) => (
            <div key={item.key} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/20">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div>
              <div className="min-w-0 flex-1"><p className="checkout-piece-title truncate text-sm">{item.name}</p><p className="checkout-muted-label text-[10px] font-mono uppercase tracking-widest">{item.color ? `${item.color} · ` : ""}Size {item.size}</p><div className="mt-2 flex items-center gap-2"><button type="button" onClick={() => changeQuantity(item.key, 'decrement')} className="liquid-ui h-6 w-6 rounded border border-white/15 text-xs text-amber-100" aria-label={`Decrease ${item.name}`}>−</button><span className="w-5 text-center text-xs">{item.quantity}</span><button type="button" onClick={() => changeQuantity(item.key, 'increment')} disabled={item.quantity >= 20} className="liquid-ui h-6 w-6 rounded border border-white/15 text-xs text-amber-100 disabled:opacity-30" aria-label={`Increase ${item.name}`}>+</button><button type="button" onClick={() => changeQuantity(item.key, 'remove')} className="ml-1 text-[9px] font-mono uppercase tracking-widest text-white/40 hover:text-amber-100">REMOVE</button></div></div>
              <span className="checkout-piece-price shrink-0 text-sm font-mono">{item.currency === 'PKR' ? 'PKR' : item.currency === 'INR' ? '₹' : '$'} {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleRealCheckout} className="space-y-4 font-mono text-xs">
          <div>
            <label htmlFor="checkout-name" className="block text-neutral-500 mb-1 uppercase">Full Name</label>
            <input
              id="checkout-name"
              name="name"
              autoComplete="name"
              type="text"
              required
              placeholder="Daud Commando"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="liquid-ui checkout-field relative z-[2] w-full rounded-lg p-3 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="checkout-email" className="block text-neutral-500 mb-1 uppercase">Email Address</label>
            <input
              id="checkout-email"
              name="email"
              autoComplete="email"
              type="email"
              required
              placeholder="daud@hadx.labs"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="liquid-ui checkout-field relative z-[2] w-full rounded-lg p-3 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="checkout-phone" className="block text-neutral-500 mb-1 uppercase">Phone Number</label>
            <input
              id="checkout-phone"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              type="tel"
              required
              placeholder="+92 300 1234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="liquid-ui checkout-field relative z-[2] w-full rounded-lg p-3 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="checkout-address" className="block text-neutral-500 mb-1 uppercase">Address</label>
              <input
                id="checkout-address"
                name="address"
                autoComplete="street-address"
                type="text"
                required
                placeholder="Sector 7"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="liquid-ui checkout-field relative z-[2] w-full rounded-lg p-3 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="checkout-city" className="block text-neutral-500 mb-1 uppercase">City</label>
              <input
                id="checkout-city"
                name="city"
                autoComplete="address-level2"
                inputMode="text"
                type="text"
                required
                placeholder="Cyber City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="liquid-ui checkout-field relative z-10 w-full rounded-lg p-3 focus:outline-none focus:border-amber-500 transition-colors touch-manipulation"
              />
            </div>
          </div>

          <div>
            <label htmlFor="checkout-country" className="checkout-muted-label mb-1 block uppercase">Country</label>
            <CustomSelect
              value={formData.country}
              onChange={(value) => {
                setFormData({ ...formData, country: value });
                if (value !== 'Other') setOtherCountry('');
              }}
              ariaLabel="Shipping country"
              options={[
                { value: '', label: 'Select country' },
                { value: 'Pakistan', label: 'Pakistan' },
                { value: 'India', label: 'India' },
                { value: 'Afghanistan', label: 'Afghanistan' },
                { value: 'Sweden', label: 'Sweden' },
                { value: 'Italy', label: 'Italy' },
                { value: 'Indonesia', label: 'Indonesia' },
                { value: 'United States', label: 'United States' },
                { value: 'United Kingdom', label: 'United Kingdom' },
                { value: 'United Arab Emirates', label: 'United Arab Emirates' },
                { value: 'Saudi Arabia', label: 'Saudi Arabia' },
                { value: 'Canada', label: 'Canada' },
                { value: 'Australia', label: 'Australia' },
                { value: 'Other', label: 'Other' },
              ]}
              placeholder="Select country"
              className="w-full checkout-country-control"
              searchable
              allowCustomOption
              searchPlaceholder="Type country name"
              onCustomSelect={(value) => setOtherCountry(value)}
            />
            {isOtherCountry ? (
              <div className="mt-3">
                <label htmlFor="checkout-other-country" className="checkout-muted-label mb-1 block uppercase">Specify your country</label>
                <input
                  id="checkout-other-country"
                  name="otherCountry"
                  autoComplete="country-name"
                  type="text"
                  required
                  placeholder="Type Afghanistan, Sweden, Italy..."
                  value={otherCountry}
                  autoFocus
                  onChange={(e) => setOtherCountry(e.target.value)}
                  className="liquid-ui checkout-field relative z-10 w-full rounded-lg p-3 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            ) : null}
          </div>

          <div className="liquid-panel checkout-payment-panel rounded-xl p-4" aria-live="polite">
            <div className="flex items-center justify-between gap-4">
              <span className="checkout-muted-label text-[10px] font-mono uppercase tracking-widest">Payment method</span>
              <span className="checkout-payment-label relative z-[2] text-[10px] font-mono uppercase tracking-widest">{paymentLabel}</span>
            </div>
            {paymentMethod === 'COD' ? <p className="mt-2 text-[11px] leading-5 text-white/55">Pakistan delivery supports Cash on Delivery only.</p> : null}
            {paymentMethod === 'CARD' ? <p className="mt-2 text-[11px] leading-5 text-white/55">Card checkout is required for international delivery.</p> : null}
            {!paymentMethod ? <p className="mt-2 text-[11px] leading-5 text-white/45">Choose your delivery country to set the correct payment route.</p> : null}
            {isPakistan ? <div className="mt-4 rounded-lg border border-amber-200/30 bg-amber-100/10 px-3 py-2 text-center text-[10px] font-mono uppercase tracking-wider text-amber-100">Cash on Delivery</div> : null}
          </div>

          {isCardPayment ? <div className="checkout-card-payment-area liquid-panel rounded-xl p-4"><CardPreview name={formData.name} number={formData.cardNumber} expiry={formData.expiry} cvv={formData.cvv} flipped={focusedCardField === 'cvv'} amount={`${currencySymbol} ${totalAmount.toLocaleString()}`} /><div className="grid gap-3"><label className="checkout-muted-label">CARD NUMBER<input required inputMode="numeric" autoComplete="cc-number" value={formatCard(formData.cardNumber)} placeholder="4242 4242 4242 4242" onFocus={() => setFocusedCardField('number')} onClick={() => { playCardFlipSound(); pulseHaptic(8); }} onChange={(event) => setCard('cardNumber', event.target.value)} className="liquid-ui checkout-field mt-1 w-full rounded-lg p-3" /></label><div className="grid grid-cols-2 gap-3"><label className="checkout-muted-label">EXPIRY<input required value={formData.expiry} placeholder="MM/YY" onFocus={() => setFocusedCardField('expiry')} onClick={() => { playCardFlipSound(); pulseHaptic(8); }} onChange={(event) => setCard('expiry', event.target.value.slice(0, 5))} className="liquid-ui checkout-field mt-1 w-full rounded-lg p-3" /></label><label className="checkout-muted-label">CVV<input required inputMode="numeric" value={formData.cvv} placeholder="123" onFocus={() => setFocusedCardField('cvv')} onClick={() => { playCardFlipSound(); pulseHaptic(12); }} onChange={(event) => setCard('cvv', event.target.value.replace(/\D/g, '').slice(0, 4))} className="liquid-ui checkout-field mt-1 w-full rounded-lg p-3" /></label></div></div><p className="checkout-card-hint">Preview animation only; final card payment is completed securely by the gateway.</p></div> : null}
          {inlineMessage ? <div role="alert" className="liquid-panel checkout-inline-message rounded-xl p-4 text-[11px] leading-5">{inlineMessage}</div> : null}

          {/* Total & Submit */}
          <div className="checkout-total-row pt-4 border-t border-neutral-800 flex items-center justify-between">
            <div>
              <span className="checkout-muted-label text-[10px] uppercase block">Total Amount</span>
              <span className="checkout-total-amount text-lg font-bold">{currencySymbol} {totalAmount.toLocaleString()}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cartItems.length === 0}
              className={`liquid-ui checkout-submit relative z-[2] px-6 py-3 rounded-xl font-bold uppercase tracking-wider ${
                isSubmitting || cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'PROCESSING...' : 'EXECUTE ORDER'}
            </button>
          </div>
          {onClearCart ? <button type="button" onClick={onClearCart} className="checkout-clear-loadout text-[10px] font-mono uppercase tracking-[0.18em] text-white/45 hover:text-amber-100">Clear current loadout</button> : null}
        </form>
      </div>

      {/* Video Modal Component */}
      <CheckoutVideoModal
        state={modalState}
        orderId={activeOrderId}
        onClose={closeModal}
        onRetry={() => {
          closeModal();
        }}
      />
    </div>
  );
}
