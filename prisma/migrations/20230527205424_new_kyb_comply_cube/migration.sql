/*
  Warnings:

  - You are about to drop the `KYBComplyCube` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "KYBComplyCube";

-- CreateTable
CREATE TABLE "kYBComplyCube" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "nomeEmpresa" TEXT NOT NULL,
    "cnpjEmpresa" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "kYBComplyCube_pkey" PRIMARY KEY ("id")
);
