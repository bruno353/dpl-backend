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

export class CreateSocioJuridicoCedenteDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário cedente',
  })
  usuarioId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'CNPJ do socio jurídico',
  })
  identificadorSocio: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome do socio',
  })
  nomeEmpresarial: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nacionalidade',
  })
  nacionalidade: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Ex: São Paulo SP',
  })
  naturalidade: string;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({
    description: 'Endereco do socio',
  })
  endereco: EnderecoDTO;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({
    description: 'Endereco do socio',
  })
  telefone: TelefoneDTO;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Email do socio',
  })
  email: string;
}
