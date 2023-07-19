/*
  Warnings:

  - You are about to drop the column `usuarioId` on the `sheetsData` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sheetsData" DROP CONSTRAINT "sheetsData_usuarioId_fkey";

-- AlterTable
ALTER TABLE "sheetsData" DROP COLUMN "usuarioId";
