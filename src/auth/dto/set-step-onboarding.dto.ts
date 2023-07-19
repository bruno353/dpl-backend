import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt } from 'class-validator';

export class SetStepOnboardingDTO {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'Passa em qual o step o usuário está, para atualizar no db',
    example: 2,
  })
  step: number;
}

export class GetStepOnboardingDTO {
  @IsNotEmpty()
  @IsInt()
  @ApiProperty({
    description: 'O número do step em que ele está',
    example: 2,
  })
  step: number;
}
