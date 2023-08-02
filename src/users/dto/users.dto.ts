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
} from 'class-validator';

export class GetUserDTO {
  @IsString()
  @ApiProperty({
    description: 'The user address',
    example: '0x08ADb3400E48cACb7d5a5CB386877B3A159d525C',
  })
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Returning tasks with a longer or a shorter deadline compared to the currently time',
    enum: ['newest', 'oldest'],
  })
  deadlineSorting: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Returning tasks with a greater or lesser estimated budget - this sorting has priority over deadlineSorting',
    enum: ['greater', 'lesser'],
  })
  estimatedBudgetSorting: string;
}

export class EditUserDTO {
  @IsString()
  @ApiProperty({
    description: 'The user address',
    example: '0x08ADb3400E48cACb7d5a5CB386877B3A159d525C',
  })
  @IsNotEmpty()
  address: string;

  @IsString()
  @ApiProperty({
    description: 'The user display name',
    example: 'Fabio',
  })
  @IsOptional()
  name: string;

  @IsString()
  @ApiProperty({
    description: 'The user profile picture hash',
    example: 'Fabio',
  })
  @IsOptional()
  profilePictureHash: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    description: 'The user tags',
    example: ['Frontend', 'Marketing'],
  })
  tags: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    description: 'The user links',
    example: ['www.github.com/bruno'],
  })
  links: string[];

  @IsString()
  @ApiProperty({
    description:
      'The update a profile, you need to provide a signature of the hash data to assure you are the profile owner',
    example:
      '0x921934902149120490123580392875903428590438590843905849035809438509438095',
  })
  @IsNotEmpty()
  signature: string;

  @IsString()
  @ApiProperty({
    description: 'Used to verifies the signature validate',
    example: '0',
    default: '0',
  })
  @IsNotEmpty()
  nonce: string;
}

export class GithubLoginDTO {
  @IsString()
  @ApiProperty({
    description:
      'The code returned on the frontend as soon as the user authorize the connection',
    example: '32134521512',
  })
  @IsNotEmpty()
  code: string;
}
