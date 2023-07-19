import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CriarPropostaCreditoDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário',
  })
  userId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Montante proposto em reais',
  })
  montanteProposto: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Porcentagem da taxa de juros proposta (0 a 100)',
  })
  taxaJurosProposto: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'Quantidade de meses que a proposta de crédito deverá ser paga',
  })
  termoProposto: string;
}
