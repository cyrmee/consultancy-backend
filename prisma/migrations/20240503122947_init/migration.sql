-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Agent', 'Student', 'Finance', 'Admission', 'Visa');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('Forum', 'Group', 'Private');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('Brother', 'Sister', 'Mother', 'Father');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Complete', 'Expired');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('Deposit', 'Admission', 'Visa');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('Pending', 'Applying', 'Accepted', 'Rejected');

-- CreateEnum
CREATE TYPE "Country" AS ENUM ('UnitedStates', 'Canada');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('Summer', 'Spring', 'Autumn', 'Winter', 'Fall');

-- CreateEnum
CREATE TYPE "VisaPaymentStatus" AS ENUM ('Paid', 'Unpaid');

-- CreateEnum
CREATE TYPE "InterviewScheduleStatus" AS ENUM ('Pending', 'Attended', 'Missed');

-- CreateEnum
CREATE TYPE "UnitedStatesVisaApplicationStatus" AS ENUM ('Pending', 'DocumentsReceived', 'VisaFeeFileUploaded', 'VisaFeePaid', 'InterviewTrainingScheduled', 'InterviewTrainingComplete', 'InterviewScheduled', 'InterviewComplete', 'SevisPaid', 'NotifiedUser');

-- CreateEnum
CREATE TYPE "CanadaVisaApplicationStatus" AS ENUM ('Pending', 'DocumentsReceived', 'VisaApplicationAndBiometricFeeAmountSet', 'VisaApplicationAndBiometricFeePaid', 'ConfirmationSent', 'NotifiedUser');

-- CreateEnum
CREATE TYPE "Operation" AS ENUM ('Create', 'Update', 'Delete');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('Visa', 'Finance', 'General');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "sendTo" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "videoLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'Private',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ForumMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL DEFAULT 'NA',
    "lastName" TEXT NOT NULL DEFAULT 'NA',
    "phoneNumber" TEXT,
    "gender" "Gender",
    "roles" "Role"[],
    "hash" TEXT NOT NULL,
    "isDeactivated" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneNumberVerified" BOOLEAN NOT NULL DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPasswordChanged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expoToken" TEXT NOT NULL,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "applicationAssignmentCount" INTEGER NOT NULL DEFAULT 0,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "studentAssignmentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "admissionEmail" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'Bole',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT DEFAULT '',
    "passportNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "passportAttachment" TEXT,
    "isPhoneNumberVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAddress" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "subCity" TEXT,
    "woreda" TEXT,
    "kebele" TEXT,
    "houseNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "StudentAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRelations" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "educationalLevel" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "relationship" "Relationship" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "StudentRelations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationBackground" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "gpa" DOUBLE PRECISION,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT,

    CONSTRAINT "EducationBackground_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "isDeposited" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "expiration" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnglishTest" (
    "id" TEXT NOT NULL,
    "practiceLink" TEXT NOT NULL,
    "practiceLink2" TEXT,
    "testDate" TIMESTAMP(3),
    "score" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "EnglishTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT,
    "applicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "country" "Country" NOT NULL,
    "educationalLevel" TEXT NOT NULL,
    "fieldOfStudy" TEXT NOT NULL,
    "institute" TEXT NOT NULL DEFAULT '',
    "intake" "Season",
    "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'Deposit',
    "admissionStatus" "AdmissionStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT NOT NULL,
    "visaId" TEXT NOT NULL,
    "financeId" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitedStatesVisa" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visaApplicationStatus" "UnitedStatesVisaApplicationStatus" NOT NULL,
    "requiredDocumentsRequested" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocumentsReceived" BOOLEAN NOT NULL DEFAULT false,
    "visaFeeFileUri" TEXT,
    "visaFeePaymentStatus" "VisaPaymentStatus" NOT NULL,
    "interviewTrainingScheduleComplete" BOOLEAN NOT NULL DEFAULT false,
    "interviewSchedule" TIMESTAMP(3),
    "interviewAttended" BOOLEAN NOT NULL DEFAULT false,
    "sevisPaymentStatus" "VisaPaymentStatus" NOT NULL,
    "visaAccepted" BOOLEAN NOT NULL DEFAULT false,
    "visaStatusNotificationSent" BOOLEAN NOT NULL DEFAULT false,
    "visaStatusNotificationSentAt" TIMESTAMP(3),

    CONSTRAINT "UnitedStatesVisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanadaVisa" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visaApplicationStatus" "CanadaVisaApplicationStatus",
    "requiredDocumentsRequested" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocumentsReceived" BOOLEAN NOT NULL DEFAULT false,
    "visaApplicationAndBiometricFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visaApplicationAndBiometricFee" "VisaPaymentStatus" NOT NULL,
    "paymentConfirmationFileUri" TEXT,
    "applicationConfirmationFileUri" TEXT,
    "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
    "confirmationReceived" BOOLEAN NOT NULL DEFAULT false,
    "visaAccepted" BOOLEAN NOT NULL DEFAULT false,
    "visaStatusNotificationSent" BOOLEAN NOT NULL DEFAULT false,
    "visaStatusNotificationSentAt" TIMESTAMP(3),

    CONSTRAINT "CanadaVisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewTrainingSchedule" (
    "id" TEXT NOT NULL,
    "unitedStatesVisaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "InterviewScheduleStatus" NOT NULL,

    CONSTRAINT "InterviewTrainingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "entity" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "operation" "Operation" NOT NULL,
    "previousValues" TEXT,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calendar" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT,
    "eventCategory" "EventCategory" NOT NULL DEFAULT 'General',
    "applicationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParticipantConversations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAddress_studentId_key" ON "StudentAddress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_applicationId_key" ON "Deposit"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "EnglishTest_applicationId_key" ON "EnglishTest"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitedStatesVisa_applicationId_key" ON "UnitedStatesVisa"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "CanadaVisa_applicationId_key" ON "CanadaVisa"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_externalId_key" ON "Calendar"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "_ParticipantConversations_AB_unique" ON "_ParticipantConversations"("A", "B");

-- CreateIndex
CREATE INDEX "_ParticipantConversations_B_index" ON "_ParticipantConversations"("B");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sendTo_fkey" FOREIGN KEY ("sendTo") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumMessage" ADD CONSTRAINT "ForumMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumMessage" ADD CONSTRAINT "ForumMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_email_fkey" FOREIGN KEY ("email") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAddress" ADD CONSTRAINT "StudentAddress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRelations" ADD CONSTRAINT "StudentRelations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationBackground" ADD CONSTRAINT "EducationBackground_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnglishTest" ADD CONSTRAINT "EnglishTest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingDocument" ADD CONSTRAINT "PendingDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_visaId_fkey" FOREIGN KEY ("visaId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitedStatesVisa" ADD CONSTRAINT "UnitedStatesVisa_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanadaVisa" ADD CONSTRAINT "CanadaVisa_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewTrainingSchedule" ADD CONSTRAINT "InterviewTrainingSchedule_unitedStatesVisaId_fkey" FOREIGN KEY ("unitedStatesVisaId") REFERENCES "UnitedStatesVisa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantConversations" ADD CONSTRAINT "_ParticipantConversations_A_fkey" FOREIGN KEY ("A") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantConversations" ADD CONSTRAINT "_ParticipantConversations_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
