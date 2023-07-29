-- CreateTable
CREATE TABLE "application" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "reward" TEXT[],
    "proposer" TEXT NOT NULL,
    "applicant" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
