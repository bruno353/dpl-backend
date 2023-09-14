-- CreateTable
CREATE TABLE "recoverPassword" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "timeStamp" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "openmeshExpertUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "recoverPassword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recoverPassword_txid_key" ON "recoverPassword"("txid");

-- AddForeignKey
ALTER TABLE "recoverPassword" ADD CONSTRAINT "recoverPassword_openmeshExpertUserId_fkey" FOREIGN KEY ("openmeshExpertUserId") REFERENCES "openmeshExpertUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
