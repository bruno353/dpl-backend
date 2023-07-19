-- CreateTable
CREATE TABLE "kybUsuario" (
    "id" TEXT NOT NULL,
    "complianceInfo" TEXT,
    "infoBasica" TEXT,
    "processosJudiciaisSocios" TEXT,
    "usuarioId" TEXT NOT NULL,
    "isUpdated" BOOLEAN DEFAULT true,
    "updateTimestamp" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "kybUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kybUsuario_usuarioId_key" ON "kybUsuario"("usuarioId");

-- AddForeignKey
ALTER TABLE "kybUsuario" ADD CONSTRAINT "kybUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
