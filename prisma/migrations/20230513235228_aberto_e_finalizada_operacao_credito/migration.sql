-- AlterTable
ALTER TABLE "operacoesCredito" ADD COLUMN     "finalizada" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "aberto" SET DEFAULT false;
