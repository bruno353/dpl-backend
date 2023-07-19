-- CreateTable
CREATE TABLE "arquivosContratosUploadUsuario" (
    "id" TEXT NOT NULL,
    "urlFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "propostaCreditoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "arquivosContratosUploadUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "arquivosContratosUploadUsuario_propostaCreditoId_key" ON "arquivosContratosUploadUsuario"("propostaCreditoId");

-- AddForeignKey
ALTER TABLE "arquivosContratosUploadUsuario" ADD CONSTRAINT "arquivosContratosUploadUsuario_propostaCreditoId_fkey" FOREIGN KEY ("propostaCreditoId") REFERENCES "propostasCredito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
