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

export class CreateAdminUserDTO {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'Email do user',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Senha do user',
  })
  password: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nome do user',
  })
  nome: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Sobrenome do user',
  })
  sobrenome: string;
}
