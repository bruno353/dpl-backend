import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmarEmailDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'Id de confirmação do email - é o token que chega no link do email do user',
  })
  objectId: string;
}
