import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InitiateConnectionVindiDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'AppPrivateKey do usuário',
  })
  appPrivateKey: string;
}
