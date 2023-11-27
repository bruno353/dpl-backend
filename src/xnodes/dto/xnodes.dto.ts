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
  MaxLength,
  IsEnum,
  Min,
  Max,
  IsNumberString,
} from 'class-validator';

enum XnodeEnum {
  DRAFT = 'Draft',
  RUNNING = 'Running',
  OFF = 'Off',
}

enum LocationEnum {
  ny = 'ny',
}

export class CreateXnodeDto {
  @IsNotEmpty()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'The xnode name',
    maxLength: 1000,
  })
  name: string;

  @IsNotEmpty()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'The xnode location',
    maxLength: 1000,
  })
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiProperty({
    required: false,
    description: 'The xnode desc',
    maxLength: 1000,
  })
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiProperty({
    required: false,
    description: 'The xnode useCase',
    maxLength: 1000,
  })
  useCase: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiProperty({
    required: false,
    description: 'The xnode type',
    maxLength: 1000,
  })
  type: string;

  @IsOptional()
  @IsString()
  @IsEnum(XnodeEnum, {
    each: true,
    message: 'Status value must be one of the following: Draft, Running, Off',
  })
  @ApiProperty({
    required: false,
    description: 'The xnode status',
    enum: ['Draft', 'Running', 'Off'],
  })
  status: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(LocationEnum, {
    each: true,
    message:
      "The server location must be ['tr', 'at', 'ch', 'da', 'la', 'ny', 'se', 'sv', 'sy', 'dc']",
  })
  @ApiProperty({
    required: false,
    description: 'The server location',
    enum: ['tr', 'at', 'ch', 'da', 'la', 'ny', 'se', 'sv', 'sy', 'dc'],
  })
  serverLoc: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(6)
  @ApiProperty({
    required: false,
    description: 'The number of servers',
  })
  serverNumber: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    description: 'The xnode websocketEnabled is enabled',
    example: true,
  })
  websocketEnabled: boolean;

  @IsNotEmpty()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @ApiProperty({
    required: false,
    description: 'The xnode features',
    isArray: true,
    example: ['binance'],
  })
  features: string[];

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  @ApiProperty({
    required: false,
    description:
      'The xnode nodes - The nodes that exists in the console created by the user',
  })
  consoleNodes: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  @ApiProperty({
    required: false,
    description:
      'The xnode edges - The edges (connections bettwen nodes) that exists in the console created by the user',
  })
  consoleEdges: string;
}

export class UpdateXnodeDto {
  @IsNotEmpty()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'The xnode id',
    maxLength: 1000,
  })
  xnodeId: string;

  @IsNotEmpty()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'The xnode name',
    maxLength: 1000,
  })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiProperty({
    required: false,
    description: 'The xnode desc',
    maxLength: 1000,
  })
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiProperty({
    required: false,
    description: 'The xnode useCase',
    maxLength: 1000,
  })
  useCase: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiProperty({
    required: false,
    description: 'The xnode type',
    maxLength: 1000,
  })
  type: string;

  @IsOptional()
  @IsString()
  @IsEnum(XnodeEnum, {
    each: true,
    message: 'Status value must be one of the following: Draft, Running, Off',
  })
  @ApiProperty({
    required: false,
    description: 'The xnode status',
    enum: ['Draft', 'Running', 'Off'],
  })
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  @ApiProperty({
    required: false,
    description:
      'The xnode nodes - The nodes that exists in the console created by the user',
  })
  consoleNodes: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  @ApiProperty({
    required: false,
    description:
      'The xnode edges - The edges (connections bettwen nodes) that exists in the console created by the user',
  })
  consoleEdges: string;
}

export class GetXnodeDto {
  @IsNotEmpty()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'The xnode id',
    maxLength: 1000,
  })
  id: string;
}

export class StoreXnodeData {
  @IsNotEmpty()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'The xnode build id',
    example: '321',
    maxLength: 1000,
  })
  buildId: string;

  @IsNotEmpty()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'Url1',
    example: 'https://query.ju98i2.tech.openmesh.network',
    maxLength: 1000,
  })
  url1: string;

  @IsNotEmpty()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'Url1',
    example: 'https://query.ju98i2.tech.openmesh.network',
    maxLength: 1000,
  })
  url2: string;

  @IsNotEmpty()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'Url1',
    example: 'https://query.ju98i2.tech.openmesh.network',
    maxLength: 1000,
  })
  url3: string;

  @IsNotEmpty()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'Url1',
    example: 'https://query.ju98i2.tech.openmesh.network',
    maxLength: 1000,
  })
  url4: string;
}
