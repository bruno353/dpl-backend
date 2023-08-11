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
        id: '1b71121d-be7c-4331-89e9-5a6e6312852b',
        name: 'Devops',
        description: null,
        addressTaskDraft: '0xb994402df294e22fae82635978979bb96c545d14',
        addressDAO: '0x38396D416dF17D22f629Da8a4e1B884D8BD35C0d',
        addressTokenList: '0xf5753a0B814eA218bF90eFd23A63B418E7BDE319',
        timestamp: null,
        createdAt: '2023-08-07T15:10:39.742Z',
        updatedAt: '2023-08-07T15:09:55.246Z',
      },
    ],
    type: DepartamentsDto,
  })
  @IsNotEmpty()
  departaments: DepartamentsDto[];
}
