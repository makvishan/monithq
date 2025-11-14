/*
  Warnings:

  - Added the required column `organizationId` to the `SSLCheck` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SSLCheck" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "SSLCheck_organizationId_idx" ON "SSLCheck"("organizationId");

-- AddForeignKey
ALTER TABLE "SSLCheck" ADD CONSTRAINT "SSLCheck_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
