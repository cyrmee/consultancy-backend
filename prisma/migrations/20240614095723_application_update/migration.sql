/*
  Warnings:

  - The `englishTestRequired` column on the `Application` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EnglishTestRequiredStatus" AS ENUM ('Pending', 'Yes', 'No');

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "englishTestRequired",
ADD COLUMN     "englishTestRequired" "EnglishTestRequiredStatus" NOT NULL DEFAULT 'Pending';
