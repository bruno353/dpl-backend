-- AlterTable
ALTER TABLE "task" ADD COLUMN     "budgetIncreased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deadlineIncreased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadataEdited" BOOLEAN NOT NULL DEFAULT false;
