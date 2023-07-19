/*
  Warnings:

  - You are about to drop the column `planilhaMetricaName` on the `sheetsData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sheetsData" DROP COLUMN "planilhaMetricaName",
ADD COLUMN     "financialDashboardId" TEXT;

-- CreateTable
CREATE TABLE "financialDashboard" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "financialDashboard_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sheetsData" ADD CONSTRAINT "sheetsData_financialDashboardId_fkey" FOREIGN KEY ("financialDashboardId") REFERENCES "financialDashboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financialDashboard" ADD CONSTRAINT "financialDashboard_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
