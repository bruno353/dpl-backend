/*
  Warnings:

  - You are about to drop the column `taskId` on the `paymentTaskDraft` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `taskDraft` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[proposalId]` on the table `taskDraft` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `proposalId` to the `paymentTaskDraft` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proposalId` to the `taskDraft` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "paymentTaskDraft" DROP CONSTRAINT "paymentTaskDraft_taskId_fkey";

-- DropIndex
DROP INDEX "taskDraft_taskId_key";

-- AlterTable
ALTER TABLE "paymentTaskDraft" DROP COLUMN "taskId",
ADD COLUMN     "proposalId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "taskDraft" DROP COLUMN "taskId",
ADD COLUMN     "proposalId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "taskDraft_proposalId_key" ON "taskDraft"("proposalId");

-- AddForeignKey
ALTER TABLE "paymentTaskDraft" ADD CONSTRAINT "paymentTaskDraft_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "taskDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
