-- AlterTable
ALTER TABLE "openmeshDataProviders" ADD COLUMN     "useCases" TEXT[] DEFAULT ARRAY[]::TEXT[];
