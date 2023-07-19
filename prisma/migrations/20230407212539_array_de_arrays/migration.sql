/*
  Warnings:

  - The `accountNumber` column on the `pluggyAPIConnection` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "pluggyAPIConnection" DROP COLUMN "accountNumber",
ADD COLUMN     "accountNumber" TEXT[];
