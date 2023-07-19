-- AlterTable
ALTER TABLE "omieAPIConnection" ADD COLUMN     "numeroClientesAtivosPorMes" TEXT DEFAULT '0',
ADD COLUMN     "numeroClientesInativosPorMes" TEXT DEFAULT '0';
