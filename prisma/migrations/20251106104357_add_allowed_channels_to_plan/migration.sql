-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "allowedChannels" TEXT[] DEFAULT ARRAY['email']::TEXT[];
