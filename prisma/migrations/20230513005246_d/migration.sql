-- CreateTable
CREATE TABLE "statsFinanceiroUsuario" (
    "id" TEXT NOT NULL,
    "grossMargin" TEXT DEFAULT '0',
    "debtRevenueRatio" TEXT DEFAULT '0',
    "ltvCAC" TEXT DEFAULT '0',
    "arpu" TEXT DEFAULT '0',
    "arrGrowthYoY" TEXT DEFAULT '0',
    "churn" TEXT DEFAULT '0',
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "statsFinanceiroUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "statsFinanceiroUsuario_usuarioId_key" ON "statsFinanceiroUsuario"("usuarioId");

-- AddForeignKey
ALTER TABLE "statsFinanceiroUsuario" ADD CONSTRAINT "statsFinanceiroUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
