/*
  Warnings:

  - The `addresses` column on the `codatAPIConnection` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `data` column on the `contaAzulAPIConnection` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `emailsMultiSign` column on the `usuario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `data` column on the `vindiAPIConnection` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "codatAPIConnection" DROP COLUMN "addresses",
ADD COLUMN     "addresses" TEXT[];

-- AlterTable
ALTER TABLE "contaAzulAPIConnection" DROP COLUMN "data",
ADD COLUMN     "data" TEXT[];

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "emailsMultiSign",
ADD COLUMN     "emailsMultiSign" TEXT[];

-- AlterTable
ALTER TABLE "vindiAPIConnection" DROP COLUMN "data",
ADD COLUMN     "data" TEXT[];
