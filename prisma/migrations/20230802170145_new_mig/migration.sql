/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "verifiedContributorSubmission" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "githubLogin" TEXT,
    "githubHTMLUrl" TEXT,
    "githubId" TEXT,
    "githubName" TEXT,
    "githubEmail" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verifiedContributorSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_address_key" ON "user"("address");

-- AddForeignKey
ALTER TABLE "verifiedContributorSubmission" ADD CONSTRAINT "verifiedContributorSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
