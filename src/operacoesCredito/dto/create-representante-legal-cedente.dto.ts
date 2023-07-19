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

export class EnderecoDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'UF do endereço',
  })
  uf: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'CEP do endereço',
  })
  cep: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Cidade do endereço',
  })
  cidade: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Bairro do endereço',
  })
  bairro: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Logradouro do endereço',
  })
  logradouro: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Número do endereço',
  })
  numero: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Complemento do endereço',
  })
  complemento?: string;
}

export class TelefoneDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Número do telefone',
  })
  numero: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'DDD do telefone',
  })
  ddd: string;
}

export class DadosAssinaturaDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'I',
  })
  tipoAssinatura: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Data de validade da assinatura',
  })
  dataValidadeAssinatura: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    description: 'Possui assinatura por certificado digital?',
  })
  possuiCertificadoDigital: boolean;
}

export class CreateRepresentanteLegalCedenteDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário cedente',
  })
  usuarioId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'CPF do representante legal',
  })
  identificadorRepresentante: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome do representante legal',
  })
  nome: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Documento RG do representante legal',
  })
  rg: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Data de nascimento do representante legal - yyyy/mm/dd',
  })
  dataNascimento: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Gênero do representante legal',
  })
  genero: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Estado civil do representante legal',
  })
  estadoCivil: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nacionalidade do representante legal',
  })
  nacionalidade: string;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({
    description: 'Endereco do representante legal',
  })
  endereco: EnderecoDTO;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({
    description: 'Endereco do representante legal',
  })
  telefone: TelefoneDTO;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Email do representante legal',
  })
  email: string;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({
    description: 'Endereco do representante legal',
  })
  dadosAssinatura: DadosAssinaturaDTO;
}
