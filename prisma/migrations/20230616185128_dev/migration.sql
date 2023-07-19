-- AlterTable
ALTER TABLE "operacoesCredito" ADD COLUMN     "ccbFile" TEXT[] DEFAULT ARRAY[]::TEXT[];
