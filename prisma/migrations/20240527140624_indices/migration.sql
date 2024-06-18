-- CreateIndex
CREATE INDEX "Application_educationalLevel_idx" ON "Application"("educationalLevel");

-- CreateIndex
CREATE INDEX "Application_fieldOfStudy_idx" ON "Application"("fieldOfStudy");

-- CreateIndex
CREATE INDEX "Application_institute_idx" ON "Application"("institute");

-- CreateIndex
CREATE INDEX "Employee_firstName_idx" ON "Employee"("firstName");

-- CreateIndex
CREATE INDEX "Employee_lastName_idx" ON "Employee"("lastName");

-- CreateIndex
CREATE INDEX "Student_firstName_idx" ON "Student"("firstName");

-- CreateIndex
CREATE INDEX "Student_lastName_idx" ON "Student"("lastName");

-- CreateIndex
CREATE INDEX "Student_admissionEmail_idx" ON "Student"("admissionEmail");

-- CreateIndex
CREATE INDEX "Student_branch_idx" ON "Student"("branch");

-- CreateIndex
CREATE INDEX "Student_passportNumber_idx" ON "Student"("passportNumber");

-- CreateIndex
CREATE INDEX "User_firstName_idx" ON "User"("firstName");

-- CreateIndex
CREATE INDEX "User_lastName_idx" ON "User"("lastName");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");
