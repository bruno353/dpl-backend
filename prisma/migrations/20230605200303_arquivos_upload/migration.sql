-- AlterTable
ALTER TABLE "arquivosUploadUsuario" ADD COLUMN     "balancoPatrimonial" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "contratosClientesEFornecedores" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "declaracaoFaturamentoUltimos12Meses" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "demonstracaoDeFluxoDeCaixa" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "dre" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "historicoDeCredito" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "orcamentoAnualEProjecao" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "relatorioMetricasFinanceirasEOperacionais" TEXT[] DEFAULT ARRAY[]::TEXT[];
