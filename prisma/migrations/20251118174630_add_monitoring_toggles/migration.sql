-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "dnsMonitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "multiRegionMonitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "performanceMonitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "securityMonitoringEnabled" BOOLEAN NOT NULL DEFAULT true;
