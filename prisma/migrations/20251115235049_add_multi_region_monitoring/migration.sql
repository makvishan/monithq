-- CreateEnum
CREATE TYPE "Region" AS ENUM ('US_EAST', 'US_WEST', 'EU_WEST', 'EU_CENTRAL', 'ASIA_EAST', 'ASIA_SOUTHEAST', 'AUSTRALIA', 'SOUTH_AMERICA');

-- CreateTable
CREATE TABLE "RegionCheck" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "status" "SiteStatus" NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "resolvedIp" TEXT,
    "dnsLookupTime" INTEGER,
    "connectTime" INTEGER,
    "tlsHandshakeTime" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegionCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegionCheck_siteId_idx" ON "RegionCheck"("siteId");

-- CreateIndex
CREATE INDEX "RegionCheck_region_idx" ON "RegionCheck"("region");

-- CreateIndex
CREATE INDEX "RegionCheck_checkedAt_idx" ON "RegionCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "RegionCheck_status_idx" ON "RegionCheck"("status");

-- AddForeignKey
ALTER TABLE "RegionCheck" ADD CONSTRAINT "RegionCheck_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
