/*
  Warnings:

  - A unique constraint covering the columns `[expoToken]` on the table `UserNotification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserNotification_expoToken_key" ON "UserNotification"("expoToken");
