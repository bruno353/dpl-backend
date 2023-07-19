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
  ArrayMaxSize,
  IsArray,
} from 'class-validator';

export class SheetsDTO {
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
      'Qual row que começam as datas, a partir do valor passado serão pegos os dados na horizontal da esquerda para a direita',
    example: '4',
  })
  dateRowStart: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'Qual column que começam as métricas, a partir do valor passado serão pegos os dados na vertical de cima para baixo',
    example: 'A',
  })
  dataColumnStart: string;
}

export class createNewDashboardFromGoogleSheetsDTO {
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
    description: 'O nome do dashboard',
    example: 'Meu dashboard',
  })
  dashboardName: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => SheetsDTO)
  @ApiProperty({
    description:
      'Lista de pagamentos que deverão ser feitos pelo cedente - YYYY-MM-DD',
    example: [
      {
        sheetId: '1YKPbt0G7DbfK26OmGPjTWU_8M6qpqSQNI3FBFjyS7Sc',
        tableSheetName: 'Página1',
        dateRowStart: 'B4',
        dataColumnStart: 'A5',
      },
      {
        sheetId: 'W123bt0G7DbfK26OmGPjTWU_8M6qpqSQNI3FBFjyS7Sc',
        tableSheetName: 'Página2',
        dateRowStart: 'B5',
        dataColumnStart: 'A1',
      },
    ],
    type: [SheetsDTO],
  })
  sheets: SheetsDTO[];
}
