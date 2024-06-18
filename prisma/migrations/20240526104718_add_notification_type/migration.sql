-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('Chat', 'Normal');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'Normal';
