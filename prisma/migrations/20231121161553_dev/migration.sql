-- CreateTable
CREATE TABLE "xnodeClaimActivities" (
    "id" TEXT NOT NULL,
    "wallet" TEXT,
    "amount" TEXT,
    "txStatus" TEXT,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "xnodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "xnodeClaimActivities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "xnodeClaimActivities" ADD CONSTRAINT "xnodeClaimActivities_xnodeId_fkey" FOREIGN KEY ("xnodeId") REFERENCES "xnode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
