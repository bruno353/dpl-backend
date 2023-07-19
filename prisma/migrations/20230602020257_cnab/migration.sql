-- CreateTable
CREATE TABLE "cNABData" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "cnpjSacado" TEXT,
    "cepSacado" TEXT,
    "logradouroSacado" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "cNABData_pkey" PRIMARY KEY ("id")
);
