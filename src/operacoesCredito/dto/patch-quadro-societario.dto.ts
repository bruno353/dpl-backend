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

export class ParticipacaoDTO {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Porcentagem da participação do sócio (0 a 100) ex: 50% -> 50',
  })
  participacaoSocietaria: string;
}

export class DadoDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'CPF ou CNPJ do sócio',
  })
  identificadorSocio: string;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({
    description: 'Dado de particiapação',
  })
  dadosSocietarios: ParticipacaoDTO;
}

export class PatchQuadroSocietarioDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário cedente',
  })
  usuarioId: string;

  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({
    description: 'CNPJ do socio jurídico',
  })
  socios: DadoDTO[];
}
