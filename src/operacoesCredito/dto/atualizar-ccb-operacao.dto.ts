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

class FileInfo {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome original do arquivo',
  })
  originalname: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Buffer do arquivo',
    type: 'string',
    format: 'binary',
  })
  buffer: Buffer;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'MIME type do arquivo',
  })
  mimetype: string;
}

export class AttCCBOperacaoDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da operação de crédito que deseja atualizar o arquivo ccb',
    example: '122121-212121-2121saqqs-sqsqsqwqw',
  })
  operacaoCreditoId: string;

  @IsOptional()
  @ApiProperty({
    description: 'O CCB da operação',
    type: FileInfo,
  })
  files: any;
}
