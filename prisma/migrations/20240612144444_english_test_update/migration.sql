/*
  Warnings:

  - The `hasPassed` column on the `EnglishTest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EnglishTestStatus" AS ENUM ('Pending', 'Passed', 'Failed');

-- AlterTable
ALTER TABLE "EnglishTest" DROP COLUMN "hasPassed",
ADD COLUMN     "hasPassed" "EnglishTestStatus" NOT NULL DEFAULT 'Pending';
