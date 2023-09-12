-- CreateTable
CREATE TABLE "openmeshExpertUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT,
    "name" TEXT,
    "foundingYear" INTEGER,
    "location" TEXT,
    "website" TEXT,
    "tags" TEXT[],
    "description" TEXT,
    "scheduleCalendlyLink" TEXT,
    "profilePictureHash" TEXT,
    "userEnabled" BOOLEAN NOT NULL DEFAULT true,
    "confirmedEmail" BOOLEAN DEFAULT false,
    "hashConfirmEmail" TEXT,
    "timestampCodeEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "openmeshExpertUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "openmeshExpertUser_email_key" ON "openmeshExpertUser"("email");
