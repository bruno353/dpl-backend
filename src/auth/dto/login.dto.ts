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

export class LoginDTO {
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
    description: 'Se o user possui auth 2fa, passar o token 2fa',
  })
  token2FA: string;
}
