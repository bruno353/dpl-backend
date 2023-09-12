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

enum TagsEnum {
  BLOCKCHAIN = 'blockchain',
  FRONTEND = 'frontend',
  BACKEND = 'backend',
}

export class CreateOpenmeshExpertUserDTO {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'User email',
    example: 'bruno@gmail.com',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  @ApiProperty({
    minLength: 8,
    maxLength: 500,
    description: 'User password',
    example: '12345',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @ApiProperty({
    maxLength: 500,
    description: 'Company name',
    example: 'Bruno',
  })
  companyName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @ApiProperty({
    maxLength: 500,
    description: 'Name',
    example: 'Bruno',
  })
  name: string;

  @IsNotEmpty()
  @IsInt()
  @Max(10000)
  @ApiProperty({
    maxLength: 10000,
    description: 'Company founding year',
    example: 2014,
  })
  foundingYear: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @ApiProperty({
    maxLength: 500,
    description: 'Company location',
    example: 'New York, US',
  })
  location: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  @ApiProperty({
    maxLength: 500,
    description: 'Company website',
    example: 'www.website.com.br',
  })
  website: string;

  @IsNotEmpty()
  @IsArray()
  @IsEnum(TagsEnum, {
    each: true,
    message:
      'Tag value must be one of the following: blockchain, frontend, backend',
  })
  @ApiProperty({
    maxLength: 500,
    description: 'Company tags',
    example: ['backend'],
  })
  tags: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  @ApiProperty({
    maxLength: 5000,
    description: 'Company description',
    example: 'Lorem ipsum relugaris',
  })
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform((value) => `https://calendly.com/${value}`)
  @ApiProperty({
    maxLength: 5000,
    description: 'Company calendly sub-path link',
    example: 'kathleen-ragos/1?month=2023-09',
  })
  scheduleCalendlyLink: string;

  @IsString()
  @ApiProperty({
    description: 'The user profile picture hash',
    example: 'ipfs://21312d10dj1209d091290d29012id09',
  })
  @IsOptional()
  profilePictureHash: string;
}
