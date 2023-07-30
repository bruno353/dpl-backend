-- AlterTable
ALTER TABLE "application" ADD COLUMN     "metadataDescription" TEXT,
ADD COLUMN     "metadataDisplayName" TEXT,
ADD COLUMN     "metadataLinks" TEXT[],
ADD COLUMN     "metadataProposedBudget" TEXT;
