-- Add a reversible archive timestamp without deleting existing order records.
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "Order_archivedAt_idx"
  ON "Order"("archivedAt");

-- Store Expo push tokens for owner devices. Tokens are unique so re-registration
-- updates the existing device rather than creating duplicate notification targets.
CREATE TABLE IF NOT EXISTS "OwnerDevice" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OwnerDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OwnerDevice_token_key"
  ON "OwnerDevice"("token");

ALTER TABLE "OwnerDevice" ENABLE ROW LEVEL SECURITY;
