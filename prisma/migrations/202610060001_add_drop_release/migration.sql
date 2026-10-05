CREATE TABLE "DropRelease" (
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

CREATE UNIQUE INDEX "DropRelease_slug_key" ON "DropRelease"("slug");

ALTER TABLE "Product"
  ADD COLUMN "dropId" TEXT,
  ADD COLUMN "dropOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Product_dropId_idx" ON "Product"("dropId");

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_dropId_fkey"
  FOREIGN KEY ("dropId") REFERENCES "DropRelease"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
