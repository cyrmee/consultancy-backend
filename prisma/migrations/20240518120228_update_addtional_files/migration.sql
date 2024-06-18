/*
  Warnings:

  - You are about to drop the column `applicationId` on the `AdditionalStudentFiles` table. All the data in the column will be lost.
  - Added the required column `studentId` to the `AdditionalStudentFiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AdditionalStudentFiles" DROP CONSTRAINT "AdditionalStudentFiles_applicationId_fkey";

-- AlterTable
ALTER TABLE "AdditionalStudentFiles" DROP COLUMN "applicationId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "AdditionalStudentFiles" ADD CONSTRAINT "AdditionalStudentFiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
