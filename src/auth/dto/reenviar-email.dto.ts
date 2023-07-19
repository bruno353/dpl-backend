import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReenviarEmailDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'Email que será reenviado o email de confirmação de criação de conta',
  })
  email: string;
}
