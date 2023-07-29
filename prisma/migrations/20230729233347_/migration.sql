/*
  Warnings:

  - A unique constraint covering the columns `[taskId,applicationId]` on the table `application` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "application" ADD COLUMN     "blockNumber" TEXT NOT NULL DEFAULT '0';

-- CreateIndex
CREATE UNIQUE INDEX "application_taskId_applicationId_key" ON "application"("taskId", "applicationId");
