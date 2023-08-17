-- AlterTable
ALTER TABLE "application" ALTER COLUMN "metadata" DROP NOT NULL,
ALTER COLUMN "timestamp" DROP NOT NULL,
ALTER COLUMN "transactionHash" DROP NOT NULL;
