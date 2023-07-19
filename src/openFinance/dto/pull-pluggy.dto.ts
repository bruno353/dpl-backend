import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PullPluggyDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'ItemId que retorna na sd',
  })
  itemId: string;
}
