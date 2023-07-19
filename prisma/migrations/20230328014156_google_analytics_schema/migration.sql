-- CreateTable
CREATE TABLE "googleAnalyticsAPIConnection" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "isUpdated" BOOLEAN DEFAULT true,
    "updateTimestamp" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "googleAnalyticsAPIConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "googleAnalyticsAPIConnection_usuarioId_key" ON "googleAnalyticsAPIConnection"("usuarioId");

-- AddForeignKey
ALTER TABLE "googleAnalyticsAPIConnection" ADD CONSTRAINT "googleAnalyticsAPIConnection_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
