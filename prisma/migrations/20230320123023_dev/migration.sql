-- CreateTable
CREATE TABLE "arquivosUploadUsuario" (
    "id" TEXT NOT NULL,
    "subscricoesFiles" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "bancarioFiles" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "contabilFiles" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "outrosFiles" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "arquivosUploadUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "arquivosUploadUsuario_usuarioId_key" ON "arquivosUploadUsuario"("usuarioId");

-- AddForeignKey
ALTER TABLE "arquivosUploadUsuario" ADD CONSTRAINT "arquivosUploadUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
