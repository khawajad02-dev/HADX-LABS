export type CartCurrency = "USD" | "PKR" | "INR";

export type CartItem = {
  key: string;
  productId: string;
  sku?: string;
  name: string;
  price: number;
  currency: CartCurrency;
  quantity: number;
  imageUrl?: string | null;
  availableSizes: string[];
  size: string;
};

export const CART_STORAGE_KEY = "hadx-cart-v1";

export function cartItemKey(productId: string, size: string, currency: CartCurrency) {
  return `${productId}::${size.toUpperCase()}::${currency}`;
}

export function normalizeCartItem(value: Partial<CartItem>): CartItem | null {
  const productId = String(value.productId || "").trim();
  const size = String(value.size || "").trim().toUpperCase();
  const currency = value.currency === "PKR" || value.currency === "INR" ? value.currency : "USD";
  const price = Number(value.price);
  const quantity = Math.min(20, Math.max(1, Math.floor(Number(value.quantity) || 1)));
  if (!productId || !String(value.name || "").trim() || !size || !Number.isFinite(price) || price <= 0) return null;
  const availableSizes = Array.isArray(value.availableSizes) && value.availableSizes.length
    ? value.availableSizes.map((item) => String(item).trim().toUpperCase()).filter(Boolean)
    : ["S", "M", "L", "XL", "XXL"];
  return {
    key: value.key || cartItemKey(productId, size, currency),
    productId,
    sku: value.sku,
    name: String(value.name).trim(),
    price,
    currency,
    quantity,
    imageUrl: value.imageUrl || null,
    availableSizes,
    size,
  };
}
