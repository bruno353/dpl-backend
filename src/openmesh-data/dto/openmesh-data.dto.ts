import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
  isEmail,
  MaxLength,
  MinLength,
  IsInt,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';

export class GetDatasetDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'dataset id',
    example: '212302130248281428401480824082121321321321321321',
  })
  id: string;
}

export class UploadDatasetsDTO {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset name',
    example: 'My dataset',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset desc',
    example: 'My dataset',
  })
  description: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Dataset tag',
    example: ['Blockchain'],
  })
  tags: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Dataset usecases',
    example: ['Blockchain'],
  })
  useCases: string;

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: 'Dataset popularity, the greater the more popular',
    example: 12,
  })
  popularity: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset company`s name',
    example: 'Openmesh',
  })
  company: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: true,
  })
  live: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    example: false,
  })
  download: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset sql',
    example:
      'SELECT number AS numberFROM  (SELECT blocktimestamp, number, size,                                  gasused   FROM ethereum_blocks   ORDER BY number) AS virtual_tableLIMIT 1000;',
  })
  sql: string;
}
