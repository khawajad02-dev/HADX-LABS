ALTER TABLE "Order" ADD COLUMN "productColor" TEXT;

CREATE INDEX "Order_productColor_idx" ON "Order"("productColor");

