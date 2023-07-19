import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetCCBFileBufferDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da operacao',
  })
  operacaoCreditoId: string;
}
