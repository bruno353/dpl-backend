import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdatePagamentoOperacao {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do pagamento',
  })
  pagamentoId: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    description: 'Se o pagamento foi feito ou não',
  })
  pagamentoRealizado: boolean;
}
