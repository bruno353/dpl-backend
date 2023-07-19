-- CreateTable
CREATE TABLE "propostasCredito" (
    "id" TEXT NOT NULL,
    "montanteProposto" TEXT NOT NULL,
    "taxaJurosProposto" TEXT,
    "termoProposto" TEXT,
    "montanteRequisitado" TEXT,
    "propostaVisualizada" BOOLEAN NOT NULL DEFAULT false,
    "propostaAceita" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "propostasCredito_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "propostasCredito" ADD CONSTRAINT "propostasCredito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
