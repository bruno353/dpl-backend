/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId]` on the table `recuperarSenha` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usuarioId` to the `recuperarSenha` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "recuperarSenha" ADD COLUMN     "usuarioId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "recuperarSenha_usuarioId_key" ON "recuperarSenha"("usuarioId");

-- AddForeignKey
ALTER TABLE "recuperarSenha" ADD CONSTRAINT "recuperarSenha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
