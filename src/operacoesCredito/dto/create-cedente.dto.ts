import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateCedenteDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Faturamento anual do cedente',
  })
  faturamentoAnual: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Id do usuário que deseja cadastrar como cedente',
  })
  usuarioId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      'Ramo de atividades do cedente: [        {          "codigo": 1,          "descricao": "Comercio"        },        {          "codigo": 2,          "descricao": "Serviço"        },        {          "codigo": 3,          "descricao": "Industria"        }      ]',
  })
  codigoRamoAtividade: string;
}
