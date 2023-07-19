import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class SacadoDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Email do sacado',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Bairro do sacado',
  })
  enderecoBairro: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'CEP do sacado',
  })
  enderecoCep: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Cidade do sacado',
  })
  enderecoCidade: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Logradouro do sacado',
  })
  enderecoLogradouro: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Logradouro do sacado',
  })
  enderecoUF: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Identificador - apenas numero (cnpj ou cpf)',
  })
  identificador: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome do sacado',
  })
  nome: string;
}

export class CreateOperacaoDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário cedente',
  })
  usuarioId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do proposta de crédito que está relacionada esta operacao',
  })
  propostaCreditoId: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description:
      'Quantidade de dias de carência para vencimento da primeira parcela.',
  })
  diasCarenciaValor: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description:
      'Intervalo, em dias, entre o vencimento de cada parcela. - Geralmente 30 dias',
  })
  diasIntervaloParcelasValor: number;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    description:
      'Adicionar despesas da operação (débito, imposto, taxa, etc.) no financiamento ou não.',
  })
  financiarDespesasOperacaoValor: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    description: 'Intervalo entre os vencimento é fixo ou não.',
  })
  fluxoIrregularVencimentoParcelasValor: boolean;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Quantidade de parcelas.',
  })
  quantidadeParcelasValor: number;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({
    description: 'Info do sacado',
  })
  sacado: SacadoDTO;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Taxa de juros mensal (ex: 1.9 = 1.9%)',
  })
  taxaJurosValor: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Taxa percentual de CDI. (ex: 1.9 = 1.9%)',
  })
  taxaPercentualCdiValor: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Valor solicitado no empréstimo.',
  })
  valorSolicitadoValor: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Codigo da conta corrente cadastrada.',
  })
  cctCodigo: number;
}
