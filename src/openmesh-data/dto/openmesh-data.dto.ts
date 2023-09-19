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
