-- CreateTable
CREATE TABLE "chartData" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "chartName" TEXT NOT NULL,
    "financialDashboardId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "chartData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "chartData" ADD CONSTRAINT "chartData_financialDashboardId_fkey" FOREIGN KEY ("financialDashboardId") REFERENCES "financialDashboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
