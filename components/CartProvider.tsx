"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CartDrawer from "@/components/CartDrawer";
import { CART_STORAGE_KEY, cartItemKey, normalizeCartItem, type CartCurrency, type CartItem } from "@/lib/cart";

type AddCartInput = Omit<CartItem, "key" | "quantity"> & { quantity?: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  hydrated: boolean;
  isOpen: boolean;
  addItem: (item: AddCartInput) => boolean;
  removeItem: (key: string) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem).filter((item): item is CartItem => Boolean(item)) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("hadx:cart", { detail: items }));
  }, [hydrated, items]);

  const addItem = useCallback((input: AddCartInput) => {
    const normalized = normalizeCartItem({ ...input, key: cartItemKey(input.productId, input.size, input.currency), quantity: input.quantity || 1 });
    if (!normalized || (items.length > 0 && items[0].currency !== normalized.currency)) return false;
    setItems((current) => {
      const existing = current.find((item) => item.key === normalized.key);
      if (!existing) return [...current, normalized];
      return current.map((item) => item.key === normalized.key ? { ...item, quantity: Math.min(20, item.quantity + normalized.quantity) } : item);
    });
    setIsOpen(true);
    return true;
  }, [items]);

  const removeItem = useCallback((key: string) => setItems((current) => current.filter((item) => item.key !== key)), []);
  const increment = useCallback((key: string) => setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.min(20, item.quantity + 1) } : item)), []);
  const decrement = useCallback((key: string) => setItems((current) => current.flatMap((item) => item.key !== key ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : [])), []);
  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    hydrated,
    isOpen,
    addItem,
    removeItem,
    increment,
    decrement,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    clearCart,
  }), [addItem, clearCart, decrement, hydrated, increment, isOpen, items, removeItem]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        onIncrement={increment}
        onDecrement={decrement}
        onRemove={removeItem}
        onCheckout={() => { setIsOpen(false); router.push("/checkout"); }}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

export function useOptionalCart() {
  return useContext(CartContext);
}

export type { AddCartInput };
