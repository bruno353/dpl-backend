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
} from 'class-validator';

export class CriarUserEmpresaDTO {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'Email do user',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Annual Recurring Revenue do user',
  })
  arr: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Runway do user',
  })
  runway: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'cnpj do user',
  })
  cnpj: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Tipo de negócio do user',
  })
  tipoNegocio: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Senha do user',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome da empresa do user',
  })
  nomeEmpresa: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nome do user',
  })
  nome: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Como o user ouviu falar da Scalable',
  })
  sobre: string;
}
