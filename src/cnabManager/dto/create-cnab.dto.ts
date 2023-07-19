import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
  Min,
  IsInt,
  Max,
  Matches,
  IsArray,
} from 'class-validator';

export class CreateCNABDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nome da empresa - sacado',
    example: 'Scalable LTDA',
  })
  nome: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'cnpj / cpf do sacado',
    example: '45506285000175',
  })
  cnpjcpf: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Valor da duplicata',
    example: 100.5,
  })
  valor: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'cep do sacado',
    example: '9605432',
  })
  cep: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'logradouro do sacado',
    example: 'Arnaldo Cesar Coelho, numero 156',
  })
  endereco: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @ApiProperty({
    description: 'Quantidade de duplicatas serão registradas por esta garantia',
    example: 3,
  })
  quantidadeDuplicatas: number;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  @ApiProperty({
    description: 'Mês e ano que começam os vencimentos',
    example: '2023-05',
  })
  vencimentoPrimeiraDuplicata: string;
}

export class CreateCNABDTOArray {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCNABDTO) // added @Type
  cnabs: CreateCNABDTO[];
}
