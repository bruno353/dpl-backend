/*
  Warnings:

  - You are about to drop the column `userAddress` on the `contaAzulAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `userAddress` on the `googleAnalyticsAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `userAddress` on the `netsuiteCodatAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `userAddress` on the `pluggyAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `userAddress` on the `vindiAPIConnection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contaAzulAPIConnection" DROP COLUMN "userAddress";

-- AlterTable
ALTER TABLE "googleAnalyticsAPIConnection" DROP COLUMN "userAddress";

-- AlterTable
ALTER TABLE "netsuiteCodatAPIConnection" DROP COLUMN "userAddress";

-- AlterTable
ALTER TABLE "pluggyAPIConnection" DROP COLUMN "userAddress";

-- AlterTable
ALTER TABLE "vindiAPIConnection" DROP COLUMN "userAddress";
