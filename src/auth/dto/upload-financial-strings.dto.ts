import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export enum DocumentType {
  BALANCO_PATRIMONIAL = 'balancoPatrimonial',
  DRE = 'dre',
  DEMONSTRACAO_FLUXO_CAIXA = 'demonstracaoDeFluxoDeCaixa',
  DECLARACAO_FATURAMENTO_ULTIMOS_12_MESES = 'declaracaoFaturamentoUltimos12Meses',
  ORCAMENTO_ANUAL_PROJECAO = 'orcamentoAnualEProjecao',
  RELATORIO_METRICAS_FINANCEIRAS_OPERACIONAIS = 'relatorioMetricasFinanceirasEOperacionais',
  HISTORICO_CREDITO = 'historicoDeCredito',
  CONTRATOS_CLIENTES_FORNECEDORES = 'contratosClientesEFornecedores',
}

export class UploadFinancialStringsDto {
  @IsNotEmpty()
  @IsEnum(DocumentType)
  @ApiProperty({
    description: 'O tipo do documento que quer realizar o upload',
    enum: [
      'balancoPatrimonial',
      'dre',
      'demonstracaoDeFluxoDeCaixa',
      'declaracaoFaturamentoUltimos12Meses',
      'orcamentoAnualEProjecao',
      'relatorioMetricasFinanceirasEOperacionais',
      'historicoDeCredito',
      'contratosClientesEFornecedores',
    ],
  })
  tipo: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(400)
  @ApiProperty({
    description: 'A URL/String que deseja fazer o upload',
    example: 'www.google.drive.com/meus-arquivos-ee90w9qe9qw0e0qwe',
  })
  url: string;
}
