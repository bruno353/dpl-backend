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

export class GetTasksDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The task departament',
    enum: ['Data', 'Blockchain', 'Cloud', 'Frontend'],
  })
  departament: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The task status 0 -> open; 1 -> active; 2 -> completed',
    enum: ['0', '1', '2'],
  })
  status: string;

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
    description: 'Search tasks based on its title and skills',
    example: 'Web3 development of website',
  })
  searchBar: string;
}

class PaymentDto {
  @ApiProperty({ example: '0x6eFbB027a552637492D827524242252733F06916' })
  @IsString()
  tokenContract: string;

  @ApiProperty({ example: '10000000000000000000' })
  @IsString()
  amount: string;

  @ApiProperty({ example: '18' })
  @IsString()
  decimals: string;
}

export class TaskDto {
  @ApiProperty({ description: 'The task id onchain', example: 0 })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The task status',
    example: 'open',
    enum: ['open', 'active', 'completed'],
  })
  @IsString()
  status: string;

  @ApiProperty({ example: ['Frontend', 'Web development', 'Backend'] })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiProperty({
    example: 'Frontend',
    enum: ['Data', 'Blockchain', 'Cloud', 'Frontend'],
  })
  @IsString()
  departament: string;

  @ApiProperty({
    example: 'Individual',
    enum: ['Individual', 'Group'],
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'the task deadline in Unix timestamp',
    example: '1689811200',
  })
  @IsString()
  deadline: string;

  @ApiProperty({ example: 'Lorem ipsum relgiar' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'My Task' })
  @IsString()
  title: string;

  // @ApiProperty({
  //   example: [
  //     '{"title": "My video","url": "https://www.youtube.com/watch?v=zizonToFXDs"}',
  //   ],
  // })
  // @IsArray()
  // @IsString({ each: true })
  // links: string[];

  @ApiProperty({
    type: [PaymentDto],
    example: [
      {
        tokenContract: '0x6eFbB027a552637492D827524242252733F06916',
        amount: '10000000000000000000',
        decimals: '18',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];
}
