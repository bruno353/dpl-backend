-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "atualizadoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "recuperarSenha" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "timeStamp" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "recuperarSenha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "nome" TEXT,
    "mercadoAtuacao" TEXT,
    "isEnabled" BOOLEAN,
    "borrower" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omieAPIConnection" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "appSecret" TEXT NOT NULL,
    "appKey" TEXT NOT NULL,
    "receitaTotal" TEXT,
    "receitaEmprestimosBancarios" TEXT,
    "receitaServicoPrestado" TEXT,
    "receitaVendaAtivos" TEXT,
    "despesaTotal" TEXT,
    "despesaComissoes" TEXT,
    "despesaJurosSobreEmprestimos" TEXT,
    "despesaInvestimentos" TEXT,
    "despesaImpostoTaxas" TEXT,
    "despesaCompraDeServicos" TEXT,
    "despesaFinanceiraBancos" TEXT,
    "despesaDevolucaoVendas" TEXT,
    "despesaSalarios" TEXT,
    "despesaPagamentoEmprestimos" TEXT,
    "despesaVendasMarketing" TEXT,
    "DRE" TEXT,
    "clientes" TEXT,
    "usuarioId" TEXT NOT NULL,
    "isUpdated" BOOLEAN DEFAULT true,
    "updateTimestamp" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "omieAPIConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "netsuiteCodatAPIConnection" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "codatNetsuiteId" TEXT,
    "codatId" TEXT,
    "codatAPIKey" TEXT,
    "receitaTotal" TEXT,
    "despesaTotal" TEXT,
    "despesaJurosSobreEmprestimos" TEXT,
    "despesaImpostoTaxas" TEXT,
    "despesaFinanceiraBancos" TEXT,
    "despesaSalarios" TEXT,
    "despesaPagamentoEmprestimos" TEXT,
    "despesaVendasMarketing" TEXT,
    "usuarioId" TEXT NOT NULL,
    "isUpdated" BOOLEAN DEFAULT true,
    "updateTimestamp" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "netsuiteCodatAPIConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contaAzulAPIConnection" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "unPaidMRR" TEXT,
    "ReceitaAnual" TEXT,
    "data" JSONB,
    "churn" TEXT,
    "ReceitaMensal" TEXT,
    "ActiveSubscriptions" TEXT,
    "ARPU" TEXT,
    "ReceitaTotal" TEXT,
    "ARRGrowthYoY" TEXT,
    "ReceitaPorAno" TEXT,
    "ReceitaPorMes" TEXT,
    "usuarioId" TEXT NOT NULL,
    "isUpdated" BOOLEAN DEFAULT true,
    "updateTimestamp" TEXT,
    "totalTimestamp" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "contaAzulAPIConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vindiAPIConnection" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "appPrivateKey" TEXT,
    "unPaidMRR" TEXT,
    "ReceitaAnual" TEXT,
    "data" JSONB,
    "churn" TEXT,
    "ReceitaMensal" TEXT,
    "ActiveSubscriptions" TEXT,
    "ARPU" TEXT,
    "ReceitaTotal" TEXT,
    "ARRGrowthYoY" TEXT,
    "ReceitaPorAno" TEXT,
    "ReceitaPorMes" TEXT,
    "usuarioId" TEXT NOT NULL,
    "isUpdated" BOOLEAN DEFAULT true,
    "updateTimestamp" TEXT,
    "totalTimestamp" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "vindiAPIConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codatAPIConnection" (
    "id" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "address" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "codatAPIConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pluggyAPIConnection" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "itemId" TEXT,
    "investments" TEXT,
    "checkingAccountBalance" TEXT,
    "creditCardBalance" TEXT,
    "KYB" TEXT,
    "usuarioId" TEXT NOT NULL,
    "isUpdated" BOOLEAN DEFAULT true,
    "updateTimestamp" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "pluggyAPIConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "omieAPIConnection_usuarioId_key" ON "omieAPIConnection"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "netsuiteCodatAPIConnection_usuarioId_key" ON "netsuiteCodatAPIConnection"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "contaAzulAPIConnection_usuarioId_key" ON "contaAzulAPIConnection"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "vindiAPIConnection_usuarioId_key" ON "vindiAPIConnection"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "pluggyAPIConnection_usuarioId_key" ON "pluggyAPIConnection"("usuarioId");

-- AddForeignKey
ALTER TABLE "omieAPIConnection" ADD CONSTRAINT "omieAPIConnection_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netsuiteCodatAPIConnection" ADD CONSTRAINT "netsuiteCodatAPIConnection_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contaAzulAPIConnection" ADD CONSTRAINT "contaAzulAPIConnection_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vindiAPIConnection" ADD CONSTRAINT "vindiAPIConnection_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pluggyAPIConnection" ADD CONSTRAINT "pluggyAPIConnection_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
