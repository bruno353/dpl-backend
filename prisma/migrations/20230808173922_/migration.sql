/*
  Warnings:

  - You are about to drop the column `addressTaskDraft` on the `departament` table. All the data in the column will be lost.
  - You are about to drop the column `addressTokenList` on the `departament` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `departament` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `departament` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `departament` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "departament" DROP COLUMN "addressTaskDraft",
DROP COLUMN "addressTokenList",
DROP COLUMN "description",
DROP COLUMN "timestamp",
ADD COLUMN     "addressTaskDrafts" TEXT,
ADD COLUMN     "addressTokenListGovernance" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "taskDraft" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" TEXT,
    "type" TEXT DEFAULT 'Individual',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillsSearch" TEXT,
    "departament" TEXT,
    "deadline" TEXT,
    "description" TEXT,
    "title" TEXT,
    "file" TEXT,
    "links" TEXT[],
    "estimatedBudget" TEXT NOT NULL DEFAULT '0',
    "contributorsNeeded" TEXT NOT NULL DEFAULT '1',
    "contributors" TEXT[],
    "executor" TEXT,
    "projectLength" TEXT NOT NULL DEFAULT 'Less than 1 week',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "taskDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymentTaskDraft" (
    "id" TEXT NOT NULL,
    "tokenContract" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "decimals" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "paymentTaskDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taskDraft_taskId_key" ON "taskDraft"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "departament_name_key" ON "departament"("name");

-- AddForeignKey
ALTER TABLE "paymentTaskDraft" ADD CONSTRAINT "paymentTaskDraft_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "taskDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
