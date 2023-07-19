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

export class kybComplyCube {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Email da empresa',
  })
  emailEmpresa: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome da empresa',
  })
  nomeEmpresa: string;

  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'CNPJ da empresaa',
  })
  cnpjEmpresa: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Site da empresa',
  })
  websiteEmpresa: number;
}
