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

export class GetUserDTO {
  @IsString()
  @ApiProperty({
    description: 'The user address',
    example: '0x08ADb3400E48cACb7d5a5CB386877B3A159d525C',
  })
  @IsNotEmpty()
  address: string;
}
