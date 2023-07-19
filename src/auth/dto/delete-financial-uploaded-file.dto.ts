import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeletarFinancialUploadedFile {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'O nome-id do arquivo',
  })
  fileName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'O tipo do arquivo',
    enum: [
      'balancoPatrimonial',
      'dre',
      'demonstracaoDeFluxoDeCaixa',
      'declaracaoFaturamentoUltimos12Meses',
      'orcamentoAnualEProjecao',
      'relatorioMetricasFinanceirasEOperacionais',
      'historicoDeCredito',
      'contratosClientesEFornecedores',
      'contabilFiles',
      'bancarioFiles',
      'outrosFiles',
    ],
  })
  tipo: string;
}
