-- CreateTable
CREATE TABLE "FutureStudentInfo" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "country" "Country" NOT NULL,
    "field" TEXT NOT NULL,

    CONSTRAINT "FutureStudentInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FutureStudentInfo_studentId_key" ON "FutureStudentInfo"("studentId");

-- AddForeignKey
ALTER TABLE "FutureStudentInfo" ADD CONSTRAINT "FutureStudentInfo_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
