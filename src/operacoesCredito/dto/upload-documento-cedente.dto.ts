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

export class UploadDocumentoCedenteDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'cartaoCNPJ - estatutoSocial - contratoSocial - comprovanteEndereco - relacaoFaturamentoUltimos12Meses',
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
}
