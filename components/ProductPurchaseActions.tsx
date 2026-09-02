"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/components/CartProvider";

type Props = {
  productId: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  selectedColor: string | null;
  availableSizes: string[];
  stockBySize: Record<string, number>;
};

export default function ProductPurchaseActions({
  productId,
  sku,
  name,
  price,
  currency,
  selectedColor,
  availableSizes,
  stockBySize,
}: Props) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size first!");
      return;
    }
    
    const stock = stockBySize[selectedSize] || 0;
    if (stock <= 0) {
      alert("This size is out of stock!");
      return;
    }

    const added = addItem({
      productId,
      sku,
      name,
      price,
      currency: currency as any,
      size: selectedSize,
      quantity,
    });

    if (!added) {
      alert("Couldn't add item — check your cart currency.");
      return;
    }
    
    // Show success feedback
    const btn = document.getElementById('add-to-cart-btn');
    if (btn) {
      btn.textContent = 'ADDED ✓';
      setTimeout(() => {
        btn.textContent = 'ADD TO CART';
      }, 1500);
    }
  };

  const totalPrice = price * quantity;

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center justify-between liquid-panel product-detail-glass rounded-2xl p-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
          Quantity
        </span>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-xl border border-white/15 bg-white/5 text-zinc-300 flex items-center justify-center text-lg hover:border-amber-400/40"
          >
            −
          </button>
          <span className="text-lg font-bold text-zinc-200 w-8 text-center">
            {quantity}
          </span>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 rounded-xl border border-white/15 bg-white/5 text-zinc-300 flex items-center justify-center text-lg hover:border-amber-400/40"
          >
            +
          </button>
        </div>
      </div>

      {/* Price Display */}
      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
          Total
        </span>
        <span className="text-2xl font-bold text-amber-300">
          {currency} {(totalPrice / 100).toFixed(2)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          id="add-to-cart-btn"
          whileTap={{ scale: 0.97 }}
          onClick={handleAddToCart}
          disabled={!selectedSize}
          className={`py-4 rounded-2xl border text-sm font-bold tracking-[0.15em] uppercase transition-all ${
            selectedSize 
              ? "border-amber-400/60 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20" 
              : "border-white/10 bg-white/5 text-zinc-600 cursor-not-allowed"
          }`}
        >
          ADD TO CART
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="py-4 rounded-2xl border border-white/15 bg-white/5 text-zinc-300 text-sm font-bold tracking-[0.15em] uppercase hover:border-amber-400/40 hover:text-amber-200 transition-all"
        >
          CHECKOUT BAG
        </motion.button>
      </div>
    </div>
  );
}