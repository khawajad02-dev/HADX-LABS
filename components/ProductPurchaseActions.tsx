// components/ProductPurchaseActions.tsx — sirf relevant parts

// Props mein add karo:
type Props = {
  productId: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  selectedColor: string | null;  // ← YEH ADD KARO
  availableSizes: string[];
  stockBySize: Record<string, number>;
};

// Jab cart mein add karo:
const handleAddToCart = () => {
  addToCart({
    productId,
    sku,
    name,
    price,
    currency,
    size: selectedSize,
    color: selectedColor,  // ← YEH ADD KARO
    quantity: 1,
  });
};
