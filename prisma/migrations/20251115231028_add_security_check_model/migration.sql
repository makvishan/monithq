-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "lastSecurityCheck" TIMESTAMP(3),
ADD COLUMN     "securityScore" INTEGER;

-- CreateTable
CREATE TABLE "SecurityCheck" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "hasHSTS" BOOLEAN NOT NULL DEFAULT false,
    "hstsMaxAge" INTEGER,
    "hstsIncludesSubdomains" BOOLEAN NOT NULL DEFAULT false,
    "hasCSP" BOOLEAN NOT NULL DEFAULT false,
    "cspPolicy" TEXT,
    "hasXFrameOptions" BOOLEAN NOT NULL DEFAULT false,
    "xFrameOptions" TEXT,
    "hasXContentType" BOOLEAN NOT NULL DEFAULT false,
    "hasXXSSProtection" BOOLEAN NOT NULL DEFAULT false,
    "hasReferrerPolicy" BOOLEAN NOT NULL DEFAULT false,
    "referrerPolicy" TEXT,
    "hasPermissionsPolicy" BOOLEAN NOT NULL DEFAULT false,
    "securityScore" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT,
    "issues" JSONB,
    "recommendations" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityCheck_siteId_idx" ON "SecurityCheck"("siteId");

-- CreateIndex
CREATE INDEX "SecurityCheck_checkedAt_idx" ON "SecurityCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "SecurityCheck_securityScore_idx" ON "SecurityCheck"("securityScore");

-- AddForeignKey
ALTER TABLE "SecurityCheck" ADD CONSTRAINT "SecurityCheck_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
