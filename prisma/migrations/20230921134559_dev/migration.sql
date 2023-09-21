-- AlterTable
ALTER TABLE "openmeshDataProviders" ADD COLUMN     "company" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
