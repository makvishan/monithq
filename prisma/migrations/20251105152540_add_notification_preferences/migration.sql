-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyOnDegradation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnIncident" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnResolution" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnlyAdmins" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SiteSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteSubscription_userId_idx" ON "SiteSubscription"("userId");

-- CreateIndex
CREATE INDEX "SiteSubscription_siteId_idx" ON "SiteSubscription"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSubscription_userId_siteId_key" ON "SiteSubscription"("userId", "siteId");

-- AddForeignKey
ALTER TABLE "SiteSubscription" ADD CONSTRAINT "SiteSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSubscription" ADD CONSTRAINT "SiteSubscription_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
