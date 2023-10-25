-- CreateTable
CREATE TABLE "applicationOffChain" (
    "id" TEXT NOT NULL,
    "metadata" TEXT,
    "reward" TEXT[],
    "proposer" TEXT,
    "applicant" TEXT,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "taken" BOOLEAN NOT NULL DEFAULT false,
    "metadataDescription" TEXT,
    "metadataProposedBudget" TEXT,
    "metadataAdditionalLink" TEXT,
    "metadataDisplayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "applicationOffChain_pkey" PRIMARY KEY ("id")
);
