/*
  Warnings:

  - A unique constraint covering the columns `[eventIndex,transactionHash,blockNumber]` on the table `event` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "event_eventIndex_transactionHash_key";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "profilePictureHash" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatesNonce" TEXT NOT NULL DEFAULT '0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_eventIndex_transactionHash_blockNumber_key" ON "event"("eventIndex", "transactionHash", "blockNumber");
