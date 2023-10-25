-- AlterTable
ALTER TABLE "applicationOffChain" ALTER COLUMN "timestamp" DROP NOT NULL,
ALTER COLUMN "timestamp" SET DEFAULT '1698253',
ALTER COLUMN "timestamp" SET DATA TYPE TEXT;
