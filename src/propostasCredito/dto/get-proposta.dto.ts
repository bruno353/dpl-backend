import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetPropostaDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id da proposta',
  })
  propostaId: string;
}
