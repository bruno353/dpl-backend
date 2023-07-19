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

export class AlterarSenhaDTO {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'Email do user',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Senha antiga do user',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nova senha do user',
  })
  newPassword: string;
}
