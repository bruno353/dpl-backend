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
  IsInt,
  IsDateString,
  ArrayMaxSize,
  IsArray,
  IsDate,
} from 'class-validator';

class DepartamentsDto {
  @IsNotEmpty()
  @ApiProperty({ example: 'Devops', description: 'The departament name' })
  @IsString()
  name: string;

  @IsOptional()
  @ApiProperty({
    example: 'Departament related to...',
    description: 'The departament desc',
  })
  @IsString()
  description: string;

  @IsOptional()
  @ApiProperty({
    example: 'Departament related to...',
    description: "Address related to the departament's task draft contract",
  })
  @IsString()
  addressTaskDraft: string;

  @IsOptional()
  @ApiProperty({
    example: 'Departament related to...',
    description: "Address related to the departament's DAO governance contract",
  })
  @IsString()
  addressDAO;

  @IsOptional()
  @ApiProperty({
    example: 'Departament related to...',
    description:
      "Address related to the departament's token list governance contract",
  })
  @IsString()
  addressTokenList;

  @IsOptional()
  @ApiProperty({
    example: 'Departament related to...',
    description:
      'Timestamp Unix global in seconds of when the departament was created;',
  })
  @IsString()
  timestamp;

  @IsOptional()
  @IsDate()
  @ApiProperty({
    example: '2023-08-04T00:00:00Z',
  })
  createdAt: Date;

  @IsOptional()
  @IsDate()
  @ApiProperty({
    example: '2023-08-04T00:00:00Z',
  })
  updatedAt: Date;
}

export class GetDepartamentsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartamentsDto)
  @ApiProperty({
    description: 'Customers cadastrados do user',
    example: [
      {
        id: 'ad712c7a-11e7-4264-a547-66b261bfb2b2',
        customerId: '124323',
        name: 'Bruno',
        country: 'Brasil',
        state: 'RS',
        city: 'Lajeado',
        zip: '00000000',
        createdAt: '2023-08-04T00:00:00.000Z',
        FreeTrialStartedAt: '2023-08-04T00:00:00.000Z',
        usuarioId: '34ecad8f-059e-4f29-ab55-267ac990b4de',
        isUpdated: true,
        criadoEm: '2023-08-04T16:08:11.294Z',
        atualizadoEm: '2023-08-04T16:08:11.294Z',
      },
    ],
    type: DepartamentsDto,
  })
  @IsNotEmpty()
  departaments: DepartamentsDto[];
}
