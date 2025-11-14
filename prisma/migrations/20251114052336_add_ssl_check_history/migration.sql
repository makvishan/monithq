-- CreateTable
CREATE TABLE "SSLCheck" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT false,
    "issuer" TEXT,
    "subject" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "daysRemaining" INTEGER,
    "serialNumber" TEXT,
    "fingerprint" TEXT,
    "algorithm" TEXT,
    "authorized" BOOLEAN,
    "authorizationError" TEXT,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SSLCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SSLCheck_siteId_idx" ON "SSLCheck"("siteId");

-- CreateIndex
CREATE INDEX "SSLCheck_checkedAt_idx" ON "SSLCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "SSLCheck_validTo_idx" ON "SSLCheck"("validTo");

-- AddForeignKey
ALTER TABLE "SSLCheck" ADD CONSTRAINT "SSLCheck_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
