-- CreateTable
CREATE TABLE "verifiedContributorToken" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT,
    "departamentList" TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verifiedContributorToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verifiedContributorToken_tokenId_key" ON "verifiedContributorToken"("tokenId");

-- AddForeignKey
ALTER TABLE "verifiedContributorToken" ADD CONSTRAINT "verifiedContributorToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
