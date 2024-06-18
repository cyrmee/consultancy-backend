/*
  Warnings:

  - You are about to drop the column `institute` on the `Application` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Application_institute_idx";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "institute";

-- AlterTable
ALTER TABLE "EnglishTest" ADD COLUMN     "hasPassed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Institute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "admissionStatus" "AdmissionStatus" NOT NULL DEFAULT 'Pending',
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "applicationId" TEXT,

    CONSTRAINT "Institute_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Institute" ADD CONSTRAINT "Institute_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
