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

export class CreateXnodeDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The xnode name',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The xnode desc',
  })
  description: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The xnode useCase',
  })
  useCase: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The xnode status',
  })
  status: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Returning tasks with a longer or a shorter deadline compared to the currently time',
    enum: ['newest', 'oldest'],
  })
  deadlineSorting: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Returning tasks with a greater or lesser estimated budget - this sorting has priority over deadlineSorting',
    enum: ['greater', 'lesser'],
  })
  estimatedBudgetSorting: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Search tasks based on its title and skills',
    example: 'Web3 development of website',
  })
  searchBar: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: 'Current page for pagination',
    minimum: 1,
    default: 1,
  })
  page: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: 'Tasks limit per page for pagination',
    minimum: 1,
    default: 10,
  })
  limit: number;
}
