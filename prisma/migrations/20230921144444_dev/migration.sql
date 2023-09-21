-- AlterTable
ALTER TABLE "openmeshDataProviders" ADD COLUMN     "download" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "live" BOOLEAN NOT NULL DEFAULT false;
