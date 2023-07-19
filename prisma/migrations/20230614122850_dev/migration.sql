-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "montante" TEXT NOT NULL,
    "operacaoCreditoId" TEXT NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_operacaoCreditoId_fkey" FOREIGN KEY ("operacaoCreditoId") REFERENCES "operacoesCredito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
