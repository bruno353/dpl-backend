-- CreateTable
CREATE TABLE "errosLogs" (
    "id" TEXT NOT NULL,
    "nomeFuncao" TEXT,
    "erro" TEXT,
    "erroDescricao" TEXT,
    "observacoes" TEXT,
    "usuarioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "errosLogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "errosLogs" ADD CONSTRAINT "errosLogs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
