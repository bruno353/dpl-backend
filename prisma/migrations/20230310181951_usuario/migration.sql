/*
  Warnings:

  - You are about to drop the column `empresa` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `privateKeySTELLAR` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `walletAddressEVM` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `walletAddressSTELLAR` on the `usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[address]` on the table `usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "usuario_privateKeySTELLAR_key";

-- DropIndex
DROP INDEX "usuario_walletAddressEVM_key";

-- DropIndex
DROP INDEX "usuario_walletAddressSTELLAR_key";

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "empresa",
DROP COLUMN "privateKeySTELLAR",
DROP COLUMN "walletAddressEVM",
DROP COLUMN "walletAddressSTELLAR",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "codatId" TEXT,
ADD COLUMN     "codatNetsuitId" TEXT,
ADD COLUMN     "codatNetsuitSyncTimestamp" DECIMAL(50,4) NOT NULL DEFAULT 0,
ADD COLUMN     "codeEmail2" TEXT DEFAULT 'false',
ADD COLUMN     "codeEmail3" TEXT DEFAULT 'false',
ADD COLUMN     "codigoEmail" BOOLEAN DEFAULT false,
ADD COLUMN     "contractCodigoEmail" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "emailConfirmado" BOOLEAN DEFAULT false,
ADD COLUMN     "emailsMultiSign" JSONB,
ADD COLUMN     "hashConfirmarEmail" TEXT,
ADD COLUMN     "isBorrower" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isMultiSign" BOOLEAN DEFAULT false,
ADD COLUMN     "lpAmount" DECIMAL(50,4) NOT NULL DEFAULT 0,
ADD COLUMN     "nome" TEXT,
ADD COLUMN     "nomeEmpresa" TEXT,
ADD COLUMN     "oauth" TEXT,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "reentrancyGuard" BOOLEAN DEFAULT false,
ADD COLUMN     "secret2FA" TEXT,
ADD COLUMN     "sobre" TEXT,
ADD COLUMN     "sobrenome" TEXT,
ADD COLUMN     "tantumId" TEXT,
ADD COLUMN     "timestampCodigoEmail" DECIMAL(50,4),
ADD COLUMN     "timestampContaCriada" DECIMAL(50,4),
ADD COLUMN     "tipoNegocio" TEXT,
ADD COLUMN     "typeCodigoEmail" TEXT,
ADD COLUMN     "usdcAmount" DECIMAL(50,4) NOT NULL DEFAULT 0,
ADD COLUMN     "usdcAmountCodigoEmail" DECIMAL(50,4),
ADD COLUMN     "use2FA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "verified2FA" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "usuario_address_key" ON "usuario"("address");
