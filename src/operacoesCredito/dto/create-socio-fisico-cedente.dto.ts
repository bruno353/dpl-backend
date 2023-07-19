import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsDate,
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

export class CreateSocioFisicoCedenteDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário cedente',
  })
  usuarioId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'CPF do socio fisico',
  })
  identificadorSocio: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'RG do socio fisico',
  })
  rg: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Data Nascimento do socio fisico ex: 1999-08-20',
  })
  dataNascimento: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'MASCULINO OU FEMININO',
  })
  genero: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Estado civil do socio',
  })
  estadoCivil: string;

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
