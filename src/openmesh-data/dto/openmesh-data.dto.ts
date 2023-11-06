import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
  isEmail,
  MaxLength,
  MinLength,
  IsInt,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';

export class GetDatasetDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'dataset id',
    example: '212302130248281428401480824082121321321321321321',
  })
  id: string;
}

export class GetDatasetsDTO {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'dataset type',
    example: 'data',
  })
  type: string;
}

export class UploadDatasetsDTO {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset name',
    example: 'My dataset',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset desc',
    example: 'My dataset',
  })
  description: string;

  @ApiProperty({
    description: 'Dataset tag',
    example: ['Blockchain'],
    type: [String],
  })
  tags: string[];

  @ApiProperty({
    description: 'Dataset usecases',
    example: ['Blockchain'],
    type: [String],
  })
  useCases: string[];

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: 'Dataset popularity, the greater the more popular',
    example: 12,
  })
  popularity: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset company`s name',
    example: 'Openmesh',
  })
  company: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset category',
    example: 'Servers',
  })
  category: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset logo`s url',
    example: 'www.logo.com/ewqe21e12',
  })
  logoURL: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset logo`s url with company name',
    example: 'www.logo.com/ewqe21e12',
  })
  logoWithCompanyNameURL: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'What is the message will be add in the box',
    example: 'Add to Xnode',
  })
  addToXnodeMessage: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset website',
    example: 'www.website.com',
  })
  website: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset location',
    example: 'my loc here',
  })
  location: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset founding Year',
    example: '2019',
  })
  foundingYear: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset relevant docs',
    example: 'www.doc.com',
  })
  relevantDocs: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Dataset is third party',
    example: true,
  })
  isThirdParty: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'If this is a live connection, the link of it',
    example: 'wss://ws.tech.l3a.xyz',
  })
  liveLink: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'If this is a download connection, the csv link of it',
    example: 'wss://ws.tech.l3a.xyz',
  })
  downloadCSVLink: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'How much space its consuming',
    example: '6 MB',
  })
  dataSpace: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The clous name where its stored (?)',
    example: 'US Virginia RE67243',
  })
  dataCloudName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The cloud link where its stored (?)',
    example: 'www.aws.com',
  })
  dataCloudLink: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Github data name',
    example: 'Coinbase Connector #3',
  })
  dataGithubName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Github data link',
    example: 'www.github.com',
  })
  dataGithubLink: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: true,
  })
  live: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({
    example: false,
  })
  download: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Dataset sql',
    example:
      'SELECT number AS numberFROM  (SELECT blocktimestamp, number, size,                                  gasused   FROM ethereum_blocks   ORDER BY number) AS virtual_tableLIMIT 1000;',
  })
  sql: string;
}
