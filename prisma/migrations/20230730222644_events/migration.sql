/*
  Warnings:

  - A unique constraint covering the columns `[eventInfo,transactionHash]` on the table `event` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "event" ADD COLUMN     "address" TEXT,
ADD COLUMN     "blockNumber" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "eventInfo" TEXT,
ADD COLUMN     "taskId" TEXT,
ADD COLUMN     "timestamp" TEXT,
ADD COLUMN     "transactionHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "event_eventInfo_transactionHash_key" ON "event"("eventInfo", "transactionHash");
