-- CreateTable
CREATE TABLE "draftVote" (
    "id" TEXT NOT NULL,
    "address" TEXT,
    "votingPower" TEXT NOT NULL DEFAULT '1',
    "voteOption" TEXT,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "draftVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "draftVote_taskId_address_key" ON "draftVote"("taskId", "address");

-- AddForeignKey
ALTER TABLE "draftVote" ADD CONSTRAINT "draftVote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
