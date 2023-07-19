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

export class RecuperarSenhaDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'A nova senha que será setada pelo user',
  })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'O id passado no link enviado pelo email do user',
  })
  objectId: string;
}
