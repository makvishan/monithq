-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customWebhookUrl" TEXT,
ADD COLUMN     "notifyViaEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyViaSlack" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyViaSms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyViaWebhook" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slackWebhookUrl" TEXT,
ADD COLUMN     "smsPhoneNumber" TEXT;
