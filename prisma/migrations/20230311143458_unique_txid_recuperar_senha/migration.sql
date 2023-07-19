/*
  Warnings:

  - A unique constraint covering the columns `[txid]` on the table `recuperarSenha` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "recuperarSenha_txid_key" ON "recuperarSenha"("txid");
