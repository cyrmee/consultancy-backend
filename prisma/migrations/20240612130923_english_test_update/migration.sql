/*
  Warnings:

  - You are about to drop the column `isRequired` on the `EnglishTest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "englishTestRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "EnglishTest" DROP COLUMN "isRequired";
