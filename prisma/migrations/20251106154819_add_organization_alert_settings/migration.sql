-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "alertCooldownMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "alertThreshold" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyOnManualCheck" BOOLEAN NOT NULL DEFAULT false;
