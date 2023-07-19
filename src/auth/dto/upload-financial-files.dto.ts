import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

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

export class UploadFinancialFilesDto {
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

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Allowed extensions: jpg, jpeg, png, pdf, xlsx, csv, txt, docx, json, zip',
  })
  files: any;
}
