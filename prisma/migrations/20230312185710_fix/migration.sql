/*
  Warnings:

  - You are about to drop the column `address` on the `codatAPIConnection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "codatAPIConnection" DROP COLUMN "address",
ADD COLUMN     "addresses" JSONB;
