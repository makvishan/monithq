-- CreateTable
CREATE TABLE "PerformanceCheck" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "totalTime" INTEGER NOT NULL,
    "dnsTime" INTEGER,
    "tcpTime" INTEGER,
    "tlsTime" INTEGER,
    "ttfb" INTEGER,
    "downloadTime" INTEGER,
    "responseSize" INTEGER,
    "transferSpeed" DOUBLE PRECISION,
    "compression" BOOLEAN NOT NULL DEFAULT false,
    "statusCode" INTEGER,
    "redirectCount" INTEGER NOT NULL DEFAULT 0,
    "redirectTime" INTEGER,
    "estimatedFCP" INTEGER,
    "estimatedLCP" INTEGER,
    "resourceCount" INTEGER,
    "resourceSizes" JSONB,
    "performanceScore" INTEGER,
    "grade" TEXT,
    "issues" JSONB,
    "recommendations" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceCheck_siteId_idx" ON "PerformanceCheck"("siteId");

-- CreateIndex
CREATE INDEX "PerformanceCheck_checkedAt_idx" ON "PerformanceCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "PerformanceCheck_performanceScore_idx" ON "PerformanceCheck"("performanceScore");

-- CreateIndex
CREATE INDEX "PerformanceCheck_grade_idx" ON "PerformanceCheck"("grade");

-- AddForeignKey
ALTER TABLE "PerformanceCheck" ADD CONSTRAINT "PerformanceCheck_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
