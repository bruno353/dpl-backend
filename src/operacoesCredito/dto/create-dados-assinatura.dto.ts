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

export class RepresentantesLegaisDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'I ou C',
  })
  tipoAssinatura: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Numero Documento do Cedente Representante',
  })
  identificadorRepresentante: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Email do representante',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Data de Validade da Assinatura',
  })
  dataValidadeAssinatura: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    description: 'Possui assinatura por certificado digital?',
  })
  possuiCertificadoDigital: boolean;
}

export class CreateDadosAssinaturaCedenteDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário cedente',
  })
  usuarioId: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Quantidade mínima de assinatura para autorizar a operacao',
  })
  quantidadeMinimaAssinaturaConjunta: number;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    description: 'A assinatura é em conjunto?',
  })
  assinaConjunto: boolean;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({
    description: 'Array dos representantes legais',
  })
  representantesLegais: RepresentantesLegaisDTO[];
}
