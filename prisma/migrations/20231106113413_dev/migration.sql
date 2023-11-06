-- AlterTable
ALTER TABLE "openmeshDataProviders" ADD COLUMN     "addToXnodeMessage" TEXT NOT NULL DEFAULT 'Coming Soon',
ADD COLUMN     "foundingYear" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "logoWithCompanyNameURL" TEXT,
ADD COLUMN     "relevantDocs" TEXT,
ADD COLUMN     "website" TEXT;
