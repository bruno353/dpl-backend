import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsArray,
  IsObject,
} from 'class-validator';

class SheetDataDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da planilha',
    example: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
  })
  id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'ID da planilha do Google',
    example: '1YKPbt0G7DbfK26OmGPjTWU_8M6qpqSQNI3FBFjyS7Sc',
  })
  spreadSheetId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome da planilha',
    example: 'Planilha 1',
  })
  spreadSheetName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome da tabela da planilha',
    example: 'Tabela 1',
  })
  spreadSheetTableName: string;
}

class SheetDataCompletedDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da planilha',
    example: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
  })
  id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'ID da planilha do Google',
    example: '1YKPbt0G7DbfK26OmGPjTWU_8M6qpqSQNI3FBFjyS7Sc',
  })
  spreadSheetId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome da planilha',
    example: 'Planilha 1',
  })
  spreadSheetName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome da tabela da planilha',
    example: 'Tabela 1',
  })
  spreadSheetTableName: string;

  @ApiProperty()
  criadoEm: string;

  @ApiProperty()
  atualizadoEm: string;
}

class ChartDataDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do chart',
    example: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
  })
  id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome do gráfico que será criado',
    example: 'lineChart',
  })
  chartName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome das métricas que será criado',
    example: 'Relação de faturamento',
  })
  metricsName: string;

  @IsNotEmpty()
  @IsObject()
  @ApiProperty({
    description: 'Os dados que irão alimentar o gráfico',
    type: 'object',
    additionalProperties: {
      type: 'number',
      description: 'Valor da métrica para um dado mês e ano',
    },
    example: {
      '2023-04': 349731213.05,
      '2023-03': 1940.74,
      '2023-02': 3613.68,
      '2023-01': 113456.63,
      // ... outros meses e anos
    },
  })
  data: Record<string, number>;

  @ApiProperty()
  criadoEm: string;

  @ApiProperty()
  atualizadoEm: string;
}

export class DashboardDataDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'ID do dashboard',
    example: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
  })
  id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome do dashboard',
    example: 'Meu dashboard',
  })
  name: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SheetDataDTO)
  @ApiProperty({
    description: 'Dados das sheets',
    example: [
      {
        id: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
        spreadSheetId: '1YKPbt0G7DbfK26OmGPjTWU_8M6qpqSQNI3FBFjyS7Sc',
        spreadSheetName: 'Planilha 1',
        spreadSheetTableName: 'Tabela 1',
      },
    ],
    type: [SheetDataDTO],
  })
  SheetsData: SheetDataDTO[];
}

export class GetDashboardReturnDTO {
  @ApiProperty({
    description: 'ID do dashboard',
    example: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do dashboard',
    example: 'Meu dashboard',
  })
  name: string;

  @ApiProperty()
  criadoEm: string;

  @ApiProperty()
  atualizadoEm: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SheetDataCompletedDTO)
  @ApiProperty({
    description: 'Dados das sheets',
    example: [
      {
        id: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
        spreadSheetId: '1YKPbt0G7DbfK26OmGPjTWU_8M6qpqSQNI3FBFjyS7Sc',
        spreadSheetName: 'Planilha 1',
        spreadSheetTableName: 'Tabela 1',
        data: [
          '{"Faturamento":{"01/02/2002":"1200","01/03/2002":"1223","01/04/2002":"1345","01/05/2002":"1444","01/06/2002":"1222","01/07/2002":"1600","01/08/2002":"1700","01/09/2002":"1710","":"","01/10/2002":"1710"}},{"Receita":{"01/02/2002":"390","01/03/2002":"320","01/04/2002":"213","01/05/2002":"1444","01/06/2002":"981","01/07/2002":"145","01/08/2002":"235","01/09/2002":"123","":"","01/10/2002":"123"}},{"LTV":{"01/02/2002":"100","01/03/2002":"300","01/04/2002":"400","01/05/2002":"500","01/06/2002":"600","01/07/2002":"500","01/08/2002":"400","01/09/2002":"300","":"","01/10/2002":"300"}},{"CAC":{"01/02/2002":"12","01/03/2002":"18","01/04/2002":"19","01/05/2002":"20","01/06/2002":"21","01/07/2002":"23","01/08/2002":"453","01/09/2002":"123","":"","01/10/2002":"123"}}',
        ],
        criadoEm: '2023-06-27 13:25:19',
        atualizadoEm: '2023-06-27 13:25:19',
      },
    ],
    type: [SheetDataCompletedDTO],
  })
  SheetsData: SheetDataCompletedDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChartDataDTO)
  @ApiProperty({
    description: 'Dados dos gráficos',
    example: [
      {
        id: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
        chartName: 'lineChart',
        data: {
          '2023-04': 349731213.05,
          '2023-03': 1940.74,
          '2023-02': 3613.68,
          '2023-01': 113456.63,
          // ... outros meses e anos
        },
        metricsName: 'Relação de faturamento',
        criadoEm: '2023-06-27 13:25:19',
        atualizadoEm: '2023-06-27 13:25:19',
      },
    ],
    type: [ChartDataDTO],
  })
  ChartData: ChartDataDTO[];
}

export class GetDashboardDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'ID do dashboard',
    example: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
  })
  id: string;
}
