/*
  Warnings:

  - You are about to drop the column `serviceFeeDepositPayed` on the `CanadaVisa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CanadaVisa" DROP COLUMN "serviceFeeDepositPayed",
ADD COLUMN     "serviceFeeDepositPaymentStatus" "DepositPaymentStatus" NOT NULL DEFAULT 'Unpaid';
