import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

class FileInfo {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome original do arquivo',
  })
  originalname: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Buffer do arquivo',
    type: 'string',
    format: 'binary',
  })
  buffer: Buffer;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'MIME type do arquivo',
  })
  mimetype: string;
}

export class UploadDocumentoRepresentanteLegalDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'cpf - rg - comprovanteEndereco',
  })
  tipoDocumento: string;

  @IsOptional()
  @ApiProperty({
    description: 'O arquivo',
    type: FileInfo,
  })
  files: any;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário-cedente',
  })
  usuarioId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id (cpf) do representante legal',
  })
  representanteLegalId: string;
}
