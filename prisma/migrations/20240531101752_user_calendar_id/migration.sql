-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_admissionId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_financeId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_visaId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calendarId" TEXT;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_visaId_fkey" FOREIGN KEY ("visaId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
