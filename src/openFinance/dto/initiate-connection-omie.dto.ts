import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InitiateConnectionOmieDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'App Key do usuário',
  })
  appKey: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'App Secret do usuário',
  })
  appSecret: string;
}
