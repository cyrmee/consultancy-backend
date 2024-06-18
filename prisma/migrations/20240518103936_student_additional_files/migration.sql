-- CreateEnum
CREATE TYPE "AdditionalFileType" AS ENUM ('MediumOfInstruction', 'RecommendationLetter', 'BankStatement', 'Other');

-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "detail" TEXT;

-- AlterTable
ALTER TABLE "EducationBackground" ADD COLUMN     "certificateFileUri" TEXT,
ADD COLUMN     "transcriptFileUri" TEXT;

-- CreateTable
CREATE TABLE "AdditionalStudentFiles" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileType" "AdditionalFileType" NOT NULL,
    "fileUri" TEXT NOT NULL,

    CONSTRAINT "AdditionalStudentFiles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdditionalStudentFiles" ADD CONSTRAINT "AdditionalStudentFiles_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
