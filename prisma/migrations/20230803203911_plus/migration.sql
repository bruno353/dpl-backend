-- CreateTable
CREATE TABLE "submission" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "proposer" TEXT NOT NULL,
    "applicant" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "metadataDescription" TEXT,
    "metadataAdditionalLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timestamp" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "blockNumber" TEXT NOT NULL DEFAULT '0',
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "submission_taskId_submissionId_key" ON "submission"("taskId", "submissionId");

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;
