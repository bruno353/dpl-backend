import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsString,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class GetDataFromASheetsGoogle {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Oauth google token',
    example: '2392dj1290d',
  })
  authToken: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da planilha',
    example: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
  })
  sheetId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome da tabela da planilha que deseja capturar os dados',
    example: 'Página1',
    default: 'Página1',
  })
  tableSheetName: string;

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
    description:
      'Qual o nome que o usuário deseja dar para essas métricas retiradas dessa planilha',
    example: 'Meu BP',
  })
  planilhaMetricaName: string;
}

export class getTablesNameFromASheetsGoogle {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Oauth google token',
    example: '2392dj1290d',
  })
  authToken: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da planilha',
    example: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
  })
  sheetId: string;
}
