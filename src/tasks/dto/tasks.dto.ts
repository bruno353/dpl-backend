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
    description: 'The task status',
    enum: ['open', 'active', 'completed'],
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
  @ApiProperty({ example: '1' })
  @IsString()
  id: string;

  @ApiProperty({ example: '0x6eFbB027a552637492D827524242252733F06916' })
  @IsString()
  tokenContract: string;

  @ApiProperty({ example: '10000000000000000000' })
  @IsString()
  amount: string;

  @ApiProperty({ example: '18' })
  @IsString()
  decimals: string;

  @ApiProperty({ example: '1' })
  @IsString()
  taskId: string;

  @ApiProperty({ example: '2023-07-19T12:34:56.789Z' })
  @IsString()
  createdAt: string;

  @ApiProperty({ example: '2023-07-19T12:34:56.789Z' })
  @IsOptional()
  @IsString()
  updatedAt?: string;
}

export class TaskDto {
  @ApiProperty({ example: '0' })
  @IsString()
  id: string;

  @ApiProperty({ example: '1' })
  @IsString()
  taskId: string;

  @ApiProperty({ example: '0' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 'Individual' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: ['Frontend', 'Web development', 'Backend'] })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiProperty({ example: 'Frontend' })
  @IsOptional()
  @IsString()
  departament?: string;

  @ApiProperty({ example: '1689811200' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiProperty({ example: 'Testeeteteteetet' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'TestyeTeste' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'QmPafYj2nTXJDPhb4ggdjDUFavXXHoE2gxaeQ9tEgPbUug' })
  @IsOptional()
  @IsString()
  file?: string;

  @ApiProperty({
    example: [
      '{"title": "My video","url": "https://www.youtube.com/watch?v=zizonToFXDs"}',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  links: string[];

  @ApiProperty({
    type: [PaymentDto],
    example: [
      {
        id: '1',
        tokenContract: '0x6eFbB027a552637492D827524242252733F06916',
        amount: '10000000000000000000',
        decimals: '18',
        taskId: '1',
        createdAt: '2023-07-19T12:34:56.789Z',
        updatedAt: '2023-07-19T12:34:56.789Z',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments: PaymentDto[];

  @ApiProperty({ example: '2023-07-19T12:34:56.789Z' })
  @IsString()
  createdAt: string;

  @ApiProperty({ example: '2023-07-19T12:34:56.789Z' })
  @IsOptional()
  @IsString()
  updatedAt?: string;
}
