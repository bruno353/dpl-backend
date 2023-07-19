-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "tokenExpired" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3),

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "empresa" TEXT,
    "walletAddressEVM" TEXT,
    "privateKeyEVM" TEXT,
    "walletAddressSTELLAR" TEXT,
    "privateKeySTELLAR" TEXT,
    "emailVerificado" BOOLEAN DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_walletAddressEVM_key" ON "usuario"("walletAddressEVM");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_privateKeyEVM_key" ON "usuario"("privateKeyEVM");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_walletAddressSTELLAR_key" ON "usuario"("walletAddressSTELLAR");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_privateKeySTELLAR_key" ON "usuario"("privateKeySTELLAR");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
