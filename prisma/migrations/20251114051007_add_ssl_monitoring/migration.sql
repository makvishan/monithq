-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "sslAlertThreshold" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "sslCertificateValid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sslDaysRemaining" INTEGER,
ADD COLUMN     "sslExpiryDate" TIMESTAMP(3),
ADD COLUMN     "sslIssuer" TEXT,
ADD COLUMN     "sslLastChecked" TIMESTAMP(3),
ADD COLUMN     "sslMonitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sslValidFrom" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Site_sslExpiryDate_idx" ON "Site"("sslExpiryDate");
