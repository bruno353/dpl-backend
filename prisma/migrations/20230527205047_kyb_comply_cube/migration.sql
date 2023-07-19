-- CreateTable
CREATE TABLE "KYBComplyCube" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "nomeEmpresa" TEXT NOT NULL,
    "cnpjEmpresa" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "KYBComplyCube_pkey" PRIMARY KEY ("id")
);
