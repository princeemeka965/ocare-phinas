-- Delivery fee moves from the Settings singleton to each product (fees vary
-- by product size/weight). Existing products inherit the old flat fee.
ALTER TABLE "Product" ADD COLUMN     "deliveryFee" INTEGER NOT NULL DEFAULT 0;

UPDATE "Product"
SET "deliveryFee" = COALESCE((SELECT "deliveryFee" FROM "Settings" WHERE "id" = 'singleton'), 0);

ALTER TABLE "Settings" DROP COLUMN "deliveryFee";
