import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsObject,
  ValidateNested,
  IsArray,
} from 'class-validator';

export class CreateChartForDashboardDTO {
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
}

export class DeleteChartForDashboardDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'ID do chart',
    example: '321030-dw-12dow-do-12dwq0dk12-2-12kfk1k',
  })
  id: string;
}
