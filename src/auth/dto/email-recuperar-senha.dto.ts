import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EmailRecuperarSenhaDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'Email que será reenviado o email de recuperação de conta - envia um link com um id para o user',
  })
  email: string;
}
