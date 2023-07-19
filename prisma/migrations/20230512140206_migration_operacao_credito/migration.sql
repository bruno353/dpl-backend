-- CreateTable
CREATE TABLE "operacoesCredito" (
    "id" TEXT NOT NULL,
    "sigmaId" TEXT NOT NULL,
    "montante" TEXT NOT NULL,
    "taxaJuros" TEXT NOT NULL,
    "termo" TEXT NOT NULL,
    "propostaAceita" BOOLEAN NOT NULL DEFAULT true,
    "usuarioId" TEXT NOT NULL,
    "propostaCreditoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "operacoesCredito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operacoesCredito_propostaCreditoId_key" ON "operacoesCredito"("propostaCreditoId");

-- AddForeignKey
ALTER TABLE "operacoesCredito" ADD CONSTRAINT "operacoesCredito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operacoesCredito" ADD CONSTRAINT "operacoesCredito_propostaCreditoId_fkey" FOREIGN KEY ("propostaCreditoId") REFERENCES "propostasCredito"("id") ON DELETE SET NULL ON UPDATE CASCADE;
