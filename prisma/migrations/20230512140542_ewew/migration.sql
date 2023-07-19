/*
  Warnings:

  - You are about to drop the column `propostaAceita` on the `operacoesCredito` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "operacoesCredito" DROP COLUMN "propostaAceita",
ADD COLUMN     "aberto" BOOLEAN NOT NULL DEFAULT true;
