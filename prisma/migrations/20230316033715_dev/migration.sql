/*
  Warnings:

  - Made the column `itemId` on table `pluggyAPIConnection` required. This step will fail if there are existing NULL values in that column.
  - Made the column `appPrivateKey` on table `vindiAPIConnection` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "omieAPIConnection" ALTER COLUMN "clientes" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "pluggyAPIConnection" ALTER COLUMN "itemId" SET NOT NULL;

-- AlterTable
ALTER TABLE "vindiAPIConnection" ALTER COLUMN "appPrivateKey" SET NOT NULL;
