"use client";

import { useState } from "react";
import InstagramDMButton from "./InstagramDMButton";
import VaultButton from "./VaultButton";
import AudioToggle from "./AudioToggle";
import CartDrawer from "./CartDrawer";

export default function CyberWheel() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Mock data for CartDrawer - in a real app this would come from a store
  const [cartItems, setCartItems] = useState<any[]>([]);

  const handleIncrement = (id: string) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const handleDecrement = (id: string) => {
    setCartItems(prev => prev.map(item => 
      item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
    ));
  };

  const handleCheckout = () => {
    window.location.href = "/checkout";
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Instagram DM Button */}
        <InstagramDMButton label="DM" />
        
        {/* Vault Button */}
        <VaultButton />
        
        {/* Audio Toggle (moved from fixed to relative in this container) */}
        <div className="relative">
          <AudioToggle />
        </div>
        
        {/* Cart Trigger */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="
            group flex items-center gap-2 rounded-full px-5 py-2.5
            backdrop-blur-md bg-black/50 border border-hadx-border
            transition-all duration-300
            hover:border-hadx-border-glow hover:shadow-gold-glow
          "
        >
          <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-hadx-gold-light">
            [EXECUTE ORDER]
          </span>
        </button>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onCheckout={handleCheckout}
      />
    </>
  );
}
