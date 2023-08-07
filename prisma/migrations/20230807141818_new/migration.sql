-- CreateTable
CREATE TABLE "departament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "addressTaskDraft" TEXT,
    "addressDAO" TEXT,
    "addressTokenList" TEXT,
    "timestamp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "departament_pkey" PRIMARY KEY ("id")
);
