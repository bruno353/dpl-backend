import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateAccessTokenContaAzulDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Parâmetro code da url',
  })
  code: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Parâmetro state da url',
  })
  state: string;
}
