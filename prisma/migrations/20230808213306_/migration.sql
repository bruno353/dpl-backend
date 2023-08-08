/*
  Warnings:

  - A unique constraint covering the columns `[proposalId,departament]` on the table `task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "task" ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proposalId" TEXT,
ALTER COLUMN "taskId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "task_proposalId_departament_key" ON "task"("proposalId", "departament");
