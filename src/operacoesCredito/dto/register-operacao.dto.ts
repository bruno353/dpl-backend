import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
  IsInt,
  IsDateString,
  IsArray,
} from 'class-validator';

class PagamentoDTO {
  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({
    description: 'Data de vencimento do pagamento',
  })
  dataVencimento: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Montante do pagamento',
  })
  montante: number;
}

export class RegisterOperacaoDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário cedente',
    example: '122121-212121-2121saqqs-sqsqsqwqw',
  })
  usuarioId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da operação no Sigma-SRM',
    example: '12212',
  })
  sigmaId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Id do proposta de crédito que está relacionada esta operacao',
    example: '122121-212121-2121saqqs-sqsqsqwqw',
  })
  propostaCreditoId: string;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'Quantidade de parcelas.',
    example: 15,
  })
  quantidadeParcelasValor: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Taxa de juros mensal (ex: 1.9 = 1.9%)',
    example: 1.9,
  })
  taxaJurosValor: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Valor solicitado no empréstimo.',
    example: 1500.0,
  })
  valorSolicitadoValor: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PagamentoDTO)
  @ApiProperty({
    description:
      'Lista de pagamentos que deverão ser feitos pelo cedente - YYYY-MM-DD',
    example: [{ dataVencimento: '2002-12-21', montante: 10000 }],
    type: [PagamentoDTO],
  })
  pagamentos: PagamentoDTO[];
}
