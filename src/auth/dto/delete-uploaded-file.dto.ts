import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeletarUploadedFile {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'O nome-id do arquivo',
  })
  fileName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'O tipo do arquivo - default: outro',
  })
  tipo: string;
}
