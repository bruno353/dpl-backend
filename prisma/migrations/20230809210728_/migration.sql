/*
  Warnings:

  - You are about to drop the column `taskId` on the `draftVote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_task,address]` on the table `draftVote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_task` to the `draftVote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "draftVote" DROP CONSTRAINT "draftVote_taskId_fkey";

-- DropIndex
DROP INDEX "draftVote_taskId_address_key";

-- AlterTable
ALTER TABLE "draftVote" DROP COLUMN "taskId",
ADD COLUMN     "id_task" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "draftVote_id_task_address_key" ON "draftVote"("id_task", "address");

-- AddForeignKey
ALTER TABLE "draftVote" ADD CONSTRAINT "draftVote_id_task_fkey" FOREIGN KEY ("id_task") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
