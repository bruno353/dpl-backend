-- CreateTable
CREATE TABLE "xnode" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "useCase" TEXT,
    "consoleNodes" TEXT,
    "consoleEdges" BOOLEAN NOT NULL DEFAULT true,
    "openmeshExpertUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "xnode_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "xnode" ADD CONSTRAINT "xnode_openmeshExpertUserId_fkey" FOREIGN KEY ("openmeshExpertUserId") REFERENCES "openmeshExpertUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
