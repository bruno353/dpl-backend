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
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Dataset name',
    example: 'My dataset',
  })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Dataset desc',
    example: 'My dataset',
  })
  description: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Dataset sql',
    example:
      'SELECT number AS numberFROM  (SELECT blocktimestamp, number, size,                                  gasused   FROM ethereum_blocks   ORDER BY number) AS virtual_tableLIMIT 1000;',
  })
  sql: string;
}
