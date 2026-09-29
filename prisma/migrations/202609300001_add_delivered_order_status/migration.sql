-- Add the archiveable delivered state used by the Owner App order history.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
