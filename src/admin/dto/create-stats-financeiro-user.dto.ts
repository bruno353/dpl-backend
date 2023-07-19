import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
  isEmail,
  IsNumberString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateStatsFinanceiroUserDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário',
  })
  usuarioId: string;

  @IsInt()
  @Max(5)
  @Min(1)
  @ApiProperty({
    description: 'Gross Margin',
    example: 3,
  })
  grossMargin: number;

  @IsInt()
  @Max(5)
  @Min(1)
  @ApiProperty({
    description: 'Debt Revenue Ratio',
    example: 3,
  })
  debtRevenueRatio: number;

  @IsInt()
  @Max(5)
  @Min(1)
  @ApiProperty({
    description: 'Runway',
    example: 3,
  })
  runway: number;

  @IsInt()
  @Max(5)
  @Min(1)
  @ApiProperty({
    description: 'ltvCAC',
    example: 3,
  })
  ltvCAC: number;

  @IsInt()
  @Max(5)
  @Min(1)
  @ApiProperty({
    description: 'arpu',
    example: 3,
  })
  arpu: number;

  @IsInt()
  @Max(5)
  @Min(1)
  @ApiProperty({
    description: 'arrGrowthYoY',
    example: 3,
  })
  arrGrowthYoY: number;

  @IsInt()
  @Max(5)
  @Min(1)
  @ApiProperty({
    description: 'churn',
    example: 3,
  })
  churn: number;
}
