/*
  Warnings:

  - You are about to drop the column `codatNetsuitId` on the `usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "codatNetsuitId",
ADD COLUMN     "codatNetsuiteId" TEXT;
