-- CreateEnum
CREATE TYPE "DepositPaymentStatus" AS ENUM ('Paid', 'Unpaid', 'Expired');

-- CreateEnum
CREATE TYPE "VisaApplicationAndBiometricFeeStatus" AS ENUM ('Attended', 'NotAttended', 'Missed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UnitedStatesVisaApplicationStatus" ADD VALUE 'DepositPaymentPending';
ALTER TYPE "UnitedStatesVisaApplicationStatus" ADD VALUE 'DepositPaymentComplete';

-- AlterTable
ALTER TABLE "CanadaVisa" ADD COLUMN     "biometricSubmissionDate" TIMESTAMP(3),
ADD COLUMN     "serviceFeeDepositDate" TIMESTAMP(3),
ADD COLUMN     "serviceFeeDepositPayed" "DepositPaymentStatus" NOT NULL DEFAULT 'Unpaid',
ADD COLUMN     "visaApplicationAndBiometricSubmitted" "VisaApplicationAndBiometricFeeStatus" NOT NULL DEFAULT 'NotAttended';

-- AlterTable
ALTER TABLE "UnitedStatesVisa" ADD COLUMN     "serviceFeeDepositDate" TIMESTAMP(3),
ADD COLUMN     "serviceFeeDepositPaymentStatus" "DepositPaymentStatus" NOT NULL DEFAULT 'Unpaid';
