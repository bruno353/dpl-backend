/*
  Warnings:

  - You are about to drop the column `metadataLinks` on the `application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "application" DROP COLUMN "metadataLinks",
ADD COLUMN     "metadataAdditionalLink" TEXT;
