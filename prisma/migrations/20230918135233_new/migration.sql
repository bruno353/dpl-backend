/*
  Warnings:

  - You are about to drop the column `name` on the `openmeshExpertUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "openmeshExpertUser" DROP COLUMN "name",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;
