/*
  Warnings:

  - You are about to drop the column `notifyOnManualCheck` on the `Organization` table. All the data in the column will be lost.

*/
-- CreateTable (before dropping the column so we can preserve data)
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'app_settings',
    "notifyOnManualCheck" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- Insert default app settings row
INSERT INTO "AppSettings" ("id", "notifyOnManualCheck", "updatedAt")
VALUES ('app_settings', false, CURRENT_TIMESTAMP);

-- AlterTable (now safe to drop the column)
ALTER TABLE "Organization" DROP COLUMN "notifyOnManualCheck";
