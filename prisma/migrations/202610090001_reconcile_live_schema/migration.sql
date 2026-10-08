-- Reconcile additive runtime schema required by the HADX storefront and owner app.
-- All changes are additive and safe to re-run; existing catalog and order rows are preserved.
CREATE TABLE IF NOT EXISTS public."DropRelease" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "tagline" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sellAfterEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DropRelease_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DropRelease_slug_key" ON public."DropRelease"("slug");
ALTER TABLE public."DropRelease" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Product" ADD COLUMN IF NOT EXISTS "dropId" TEXT;
ALTER TABLE public."Product" ADD COLUMN IF NOT EXISTS "dropOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Product_dropId_idx" ON public."Product"("dropId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_dropId_fkey' AND conrelid = 'public."Product"'::regclass) THEN
    ALTER TABLE public."Product" ADD CONSTRAINT "Product_dropId_fkey" FOREIGN KEY ("dropId") REFERENCES public."DropRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE public."Order" ADD COLUMN IF NOT EXISTS "productColor" TEXT;
CREATE INDEX IF NOT EXISTS "Order_productColor_idx" ON public."Order"("productColor");

CREATE TABLE IF NOT EXISTS public."ProductReview" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "body" TEXT NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProductReview_productId_approved_createdAt_idx" ON public."ProductReview"("productId", "approved", "createdAt");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductReview_productId_fkey' AND conrelid = 'public."ProductReview"'::regclass) THEN
    ALTER TABLE public."ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
ALTER TABLE public."ProductReview" ENABLE ROW LEVEL SECURITY;
