-- CreateTable
CREATE TABLE "DnsCheck" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "resolutionTime" INTEGER NOT NULL,
    "aRecords" JSONB,
    "aaaaRecords" JSONB,
    "cnameRecords" JSONB,
    "mxRecords" JSONB,
    "nsRecords" JSONB,
    "txtRecords" JSONB,
    "soaRecord" JSONB,
    "nameservers" JSONB,
    "recordsHash" TEXT,
    "changesDetected" BOOLEAN NOT NULL DEFAULT false,
    "previousHash" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DnsCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DnsCheck_siteId_idx" ON "DnsCheck"("siteId");

-- CreateIndex
CREATE INDEX "DnsCheck_hostname_idx" ON "DnsCheck"("hostname");

-- CreateIndex
CREATE INDEX "DnsCheck_checkedAt_idx" ON "DnsCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "DnsCheck_changesDetected_idx" ON "DnsCheck"("changesDetected");

-- AddForeignKey
ALTER TABLE "DnsCheck" ADD CONSTRAINT "DnsCheck_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
