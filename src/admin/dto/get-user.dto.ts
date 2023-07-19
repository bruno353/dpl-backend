import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class GetUserDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário',
  })
  userId: string;
}
