import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetOperacaoDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da operacao no sigma',
  })
  operacaoSigmaId: string;
}

export class GetOperacaoScalableDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da operacao na plataforma scalable',
  })
  operacaoId: string;
}
