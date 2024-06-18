/*
  Warnings:

  - A unique constraint covering the columns `[expoToken,userId]` on the table `UserNotification` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserNotification_expoToken_key";

-- CreateIndex
CREATE UNIQUE INDEX "UserNotification_expoToken_userId_key" ON "UserNotification"("expoToken", "userId");
