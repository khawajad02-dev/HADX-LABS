ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "productColor" TEXT;

CREATE INDEX IF NOT EXISTS "Order_productColor_idx" ON "Order"("productColor");

