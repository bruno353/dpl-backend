-- CreateTable
CREATE TABLE "sheetsData" (
    "id" TEXT NOT NULL,
    "data" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "spreadSheetId" TEXT,
    "spreadSheetName" TEXT,
    "spreadSheetTableName" TEXT,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "sheetsData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sheetsData" ADD CONSTRAINT "sheetsData_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
