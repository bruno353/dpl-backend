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
  DEPLOYING = 'Deploying',
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
    message:
      'Status value must be one of the following: Draft, Deploying, Running, Off',
  })
  @ApiProperty({
    required: false,
    description: 'The xnode status',
    enum: ['Draft', 'Deploying', 'Running', 'Off'],
  })
  status: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(LocationEnum, {
    each: true,
    message: "The server location must be ['ny']",
  })
  @ApiProperty({
    required: false,
    description: 'The server location',
    enum: ['ny'],
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
    enum: ['Draft', 'Running', 'Deploying', 'Off'],
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

export class ConnectAPI {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The api key',
    example: '2012-12--32-134--214-213421412-421412',
  })
  apiKey: string;
}

export class StoreXnodeSigningMessageDataDTO {
  @IsNotEmpty()
  @MaxLength(10000)
  @IsString()
  @ApiProperty({
    description: 'The xnode id',
    example: '321',
    maxLength: 10000,
  })
  xnodeId: string;

  @IsNotEmpty()
  @MaxLength(10000)
  @IsString()
  @ApiProperty({
    description: 'The signed message',
    example:
      '0x9204i12df90jk209dijk12092i1903i90213i920390213i9012i3902i30921i903i213903i9012i39012i903ehjd209jh1209',
    maxLength: 10000,
  })
  signedMessage: string;
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

  @IsOptional()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'Url1',
    example: 'https://query.ju98i2.tech.openmesh.network',
    maxLength: 1000,
  })
  url1: string;

  @IsOptional()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'Url1',
    example: 'https://query.ju98i2.tech.openmesh.network',
    maxLength: 1000,
  })
  url2: string;

  @IsOptional()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'Url1',
    example: 'https://query.ju98i2.tech.openmesh.network',
    maxLength: 1000,
  })
  url3: string;

  @IsOptional()
  @MaxLength(1000)
  @IsString()
  @ApiProperty({
    description: 'Url1',
    example: 'https://query.ju98i2.tech.openmesh.network',
    maxLength: 1000,
  })
  url4: string;

  @IsOptional()
  @MaxLength(100000)
  @IsString()
  @ApiProperty({
    description: 'Any additional value',
    example: 'https://query.ju98i2.tech.openmesh.network',
    maxLength: 100000,
  })
  additional: string;
}
