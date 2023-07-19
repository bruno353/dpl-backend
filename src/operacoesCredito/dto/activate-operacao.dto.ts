import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateOperacaoDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da operacao',
  })
  operacaoId: string;
}
