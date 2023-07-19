/*
  Warnings:

  - You are about to drop the column `configChamaAPI` on the `errosLogs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "errosLogs" DROP COLUMN "configChamaAPI",
ADD COLUMN     "configChamadaAPI" TEXT;
