/*
  Warnings:

  - You are about to drop the column `ActiveSubscriptions` on the `contaAzulAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ReceitaAnual` on the `contaAzulAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ReceitaMensal` on the `contaAzulAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ReceitaPorAno` on the `contaAzulAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ReceitaPorMes` on the `contaAzulAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ReceitaTotal` on the `contaAzulAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ActiveSubscriptions` on the `vindiAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ReceitaAnual` on the `vindiAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ReceitaMensal` on the `vindiAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ReceitaPorAno` on the `vindiAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ReceitaPorMes` on the `vindiAPIConnection` table. All the data in the column will be lost.
  - You are about to drop the column `ReceitaTotal` on the `vindiAPIConnection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contaAzulAPIConnection" DROP COLUMN "ActiveSubscriptions",
DROP COLUMN "ReceitaAnual",
DROP COLUMN "ReceitaMensal",
DROP COLUMN "ReceitaPorAno",
DROP COLUMN "ReceitaPorMes",
DROP COLUMN "ReceitaTotal",
ADD COLUMN     "activeSubscriptions" TEXT,
ADD COLUMN     "receitaAnual" TEXT,
ADD COLUMN     "receitaMensal" TEXT,
ADD COLUMN     "receitaPorAno" TEXT,
ADD COLUMN     "receitaPorMes" TEXT,
ADD COLUMN     "receitaTotal" TEXT;

-- AlterTable
ALTER TABLE "vindiAPIConnection" DROP COLUMN "ActiveSubscriptions",
DROP COLUMN "ReceitaAnual",
DROP COLUMN "ReceitaMensal",
DROP COLUMN "ReceitaPorAno",
DROP COLUMN "ReceitaPorMes",
DROP COLUMN "ReceitaTotal",
ADD COLUMN     "activeSubscriptions" TEXT,
ADD COLUMN     "receitaAnual" TEXT,
ADD COLUMN     "receitaMensal" TEXT,
ADD COLUMN     "receitaPorAno" TEXT,
ADD COLUMN     "receitaPorMes" TEXT,
ADD COLUMN     "receitaTotal" TEXT;
