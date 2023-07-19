/*
  Warnings:

  - You are about to drop the `TaskT` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "TaskT";

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" TEXT,
    "type" TEXT DEFAULT 'Individual',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "departament" TEXT,
    "deadline" TEXT,
    "description" TEXT,
    "title" TEXT,
    "file" TEXT,
    "links" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "tokenContract" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "decimals" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_taskId_key" ON "task"("taskId");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
