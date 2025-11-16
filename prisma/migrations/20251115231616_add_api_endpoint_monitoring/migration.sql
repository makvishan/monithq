-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('WEB', 'API', 'PING');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS');

-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "authType" TEXT,
ADD COLUMN     "authValue" TEXT,
ADD COLUMN     "expectedStatus" INTEGER[] DEFAULT ARRAY[200]::INTEGER[],
ADD COLUMN     "httpMethod" "HttpMethod" NOT NULL DEFAULT 'GET',
ADD COLUMN     "requestBody" JSONB,
ADD COLUMN     "requestHeaders" JSONB,
ADD COLUMN     "responseValidation" JSONB,
ADD COLUMN     "siteType" "SiteType" NOT NULL DEFAULT 'WEB';

-- CreateTable
CREATE TABLE "ApiCheck" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "requestMethod" "HttpMethod" NOT NULL,
    "requestHeaders" JSONB,
    "requestBody" JSONB,
    "responseTime" INTEGER NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseBody" JSONB,
    "responseHeaders" JSONB,
    "validationPassed" BOOLEAN NOT NULL DEFAULT true,
    "validationErrors" JSONB,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiCheck_siteId_idx" ON "ApiCheck"("siteId");

-- CreateIndex
CREATE INDEX "ApiCheck_checkedAt_idx" ON "ApiCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "ApiCheck_statusCode_idx" ON "ApiCheck"("statusCode");

-- CreateIndex
CREATE INDEX "ApiCheck_validationPassed_idx" ON "ApiCheck"("validationPassed");

-- AddForeignKey
ALTER TABLE "ApiCheck" ADD CONSTRAINT "ApiCheck_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
