/*
  Warnings:

  - You are about to drop the column `eventInfo` on the `event` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventIndex,transactionHash]` on the table `event` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "event_eventInfo_transactionHash_key";

-- AlterTable
ALTER TABLE "event" DROP COLUMN "eventInfo",
ADD COLUMN     "eventIndex" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "event_eventIndex_transactionHash_key" ON "event"("eventIndex", "transactionHash");
