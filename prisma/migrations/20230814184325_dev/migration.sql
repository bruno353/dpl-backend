-- CreateTable
CREATE TABLE "speakersRegistrationCalendly" (
    "id" TEXT NOT NULL,
    "uri" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "additionalInfo" TEXT,
    "eventAt" TIMESTAMP(3),
    "active" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "speakersRegistrationCalendly_pkey" PRIMARY KEY ("id")
);
