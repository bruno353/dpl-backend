/*
  Warnings:

  - Added the required column `openmeshExpertUserId` to the `applicationOffChain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskId` to the `applicationOffChain` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "applicationOffChain" ADD COLUMN     "openmeshExpertUserId" TEXT NOT NULL,
ADD COLUMN     "taskId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "applicationOffChain" ADD CONSTRAINT "applicationOffChain_openmeshExpertUserId_fkey" FOREIGN KEY ("openmeshExpertUserId") REFERENCES "openmeshExpertUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicationOffChain" ADD CONSTRAINT "applicationOffChain_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;
