import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DidDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tokenId: string;
}
