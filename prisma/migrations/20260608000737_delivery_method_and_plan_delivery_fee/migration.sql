-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('delivery', 'pickup');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'delivery';

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "deliveryFee" INTEGER NOT NULL DEFAULT 0;
