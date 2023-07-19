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

export class GetDataFromACSVSheetsDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'Qual o nome que o usuário deseja dar para essas métricas retiradas dessa planilha',
    example: 'Meu BP',
  })
  planilhaMetricaName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'Qual célula que começam as datas, a partir do valor passado serão pegos os dados na horizontal da esquerda para a direita',
    example: 'A1',
  })
  dateRowStart: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'Qual célula que começam as métricas, a partir do valor passado serão pegos os dados na vertical de cima para baixo',
    example: 'B2',
  })
  dataColumnStart: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome da tabela da planilha que deseja capturar os dados',
    example: 'Página1',
    default: 'Página1',
  })
  tableSheetName: string;

  @IsOptional()
  @ApiProperty({
    description: 'A planilha que o usuário deseja capturar os dados',
    type: FileInfo,
  })
  files: any;
}
