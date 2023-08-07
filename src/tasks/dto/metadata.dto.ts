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
  Max,
  Min,
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

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: 'Current page for pagination',
    minimum: 1,
    default: 1,
  })
  page: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({
    description: 'Tasks limit per page for pagination',
    minimum: 1,
    default: 10,
  })
  limit: number;
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

  @ApiProperty({
    description: 'How many days are left to do the task',
    example: '15 days left',
  })
  @IsString()
  daysLeft: string;

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

class PaginationDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  currentPage: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  totalPages: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  totalTasks: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  limit: number;
}

class CountingDto {
  @ApiProperty({
    description: 'Of the total tasks after the filtering, how many are open',
    example: 1,
  })
  @IsNumber()
  open: number;

  @ApiProperty({
    description: 'Of the total tasks after the filtering, how many are active',
    example: 2,
  })
  @IsNumber()
  active: number;

  @ApiProperty({
    description:
      'Of the total tasks after the filtering, how many are completed',
    example: 20,
  })
  @IsNumber()
  completed: number;
}

class ContributorsDTO {
  @ApiProperty({
    description: "The contributor's wallet address",
    example: '0x08ADb3400E48cACb7d5a5CB386877B3A159d525C',
  })
  @IsString()
  walletAddress: string;

  @ApiProperty({
    description: "The contributors's budget percentage",
    example: 2,
  })
  @Max(100)
  @Min(0.01)
  @IsNumber()
  budgetPercentage: number;
}

class LinksDTO {
  @ApiProperty({
    description: "The link's title",
    example: 'Github repository',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "The link's url",
    example: 'www.github.com.br',
  })
  @IsString()
  url: string;
}

export class UploadIPFSMetadataTaskCreationDTO {
  @IsNotEmpty()
  @ApiProperty({
    description: "Task's title",
    example: 'My task',
  })
  @IsString()
  title: string;

  @IsNotEmpty()
  @ApiProperty({
    description: "Task's description",
    example: 'Lorem ipsum religaris...',
  })
  @IsString()
  description: string;

  @IsNotEmpty()
  @ApiProperty({
    description: "Task's deadline",
    example: '2000-10-31T01:30:00.000-05:00',
  })
  @IsDate()
  deadline: Date;

  @IsNotEmpty()
  @ApiProperty({
    description: "Task's departament",
    example: 'Data',
    enum: ['Data', 'Frontend', 'Blockchain', 'Cloud'],
  })
  @IsString()
  departament: string;

  @IsNotEmpty()
  @ApiProperty({
    description: "Task's project length",
    example: 'Less than 1 week',
    enum: [
      'Less than 1 week',
      '1 to 2 weeks',
      '2 to 4 weeks',
      'More than 4 weeks',
    ],
  })
  @IsString()
  projectLength: string;

  @IsNotEmpty()
  @ApiProperty({
    description: "Task's number of applications",
    example: 'Only 1',
    enum: ['Only 1', '2 to 4', '5 to 8', 'More than 8'],
  })
  @IsString()
  numberOfApplicants: string;

  @IsOptional()
  @ApiProperty({
    type: [ContributorsDTO],
    example: [
      {
        walletAddress: '0x6eFbB027a552637492D827524242252733F06916',
        budgetPercentage: 50,
      },
      {
        walletAddress: '0x2aFB017a562637492D809824241112733F089122',
        budgetPercentage: 50,
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => ContributorsDTO)
  contributors: ContributorsDTO[] | null;

  @IsNotEmpty()
  @ApiProperty({
    description: "Task's skills required",
    example: ['Data', 'Web development'],
    enum: [
      'Backend',
      'Frontend',
      'Web development',
      'Solidity',
      'UI',
      'UX',
      'HR',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsOptional()
  @ApiProperty({
    type: [LinksDTO],
    example: [
      {
        title: 'Github repository',
        url: 'www.github.com',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => LinksDTO)
  links: LinksDTO[] | null;
}

export class UploadIPFSMetadataTaskApplicationDTO {
  @IsNotEmpty()
  @ApiProperty({
    description: "Application's title",
    example: 'My task',
  })
  @IsString()
  displayName: string;

  @IsNotEmpty()
  @ApiProperty({
    description: "Application's description",
    example: 'Lorem ipsum religaris...',
  })
  @IsString()
  description: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'How likely to meet the deadline for the task',
    example: 'Very unlikely',
    enum: ['Very unlikely', 'Unlikely', 'Likely', 'Very likely'],
  })
  @IsString()
  howLikelyToMeetTheDeadline: string;

  @IsNotEmpty()
  @ApiProperty({
    description:
      'The percentage of the budget that the user is requesting for doing the task - Ex: 120 means he wants 120% of the currently value in dollars of the tokens set as the budget',
    example: 120,
  })
  @IsNumber()
  @Max(250)
  @Min(0)
  budgetPercentageRequested: number;

  @IsOptional()
  @ApiProperty({
    type: LinksDTO,
    isArray: true,
    example: [
      {
        title: 'Github repository',
        url: 'www.github.com',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => LinksDTO)
  links: LinksDTO[] | null;
}

export class IPFSUploadTaskCreationResponseDTO {
  @IsNotEmpty()
  @ApiProperty({
    description: 'The ipfs hash metadata',
    example: 'QmX8MeaSR16FEmk6YxRfFJjgSNf5B7DJHDRvLhCcqNhSSv',
  })
  @IsString()
  hash: string;
}

export class UploadIPFSMetadataTaskSubmissionDTO {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Submission description',
    example: 'Lorem ipsum religaris...',
  })
  @IsString()
  description: string;

  @IsNotEmpty()
  @ApiProperty({
    description: "Submission's links",
    example: ['www.github.com/repo', 'www.docs.google.com'],
  })
  @IsArray()
  @IsString({ each: true })
  links: string[];
}

export class UploadIPFSMetadataTaskSubmissionRevisionDTO {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Review feedback',
    example: 'Lorem ipsum religaris...',
  })
  @IsString()
  description: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Review outcome',
    example: 'Accept',
    enum: ['Accept', 'Reject'],
  })
  @IsString()
  judgment: string;
}

export class UploadIPFSMetadataTaskDraftCreationDTO {
  @IsOptional()
  @ApiProperty({
    example: 'Lorem ipsum religaris...',
  })
  @IsString()
  title: string;

  @IsOptional()
  @ApiProperty({
    example: 'Lorem ipsum religaris...',
  })
  @IsString()
  description: string;

  @IsOptional()
  @ApiProperty({
    example: 'Lorem ipsum religaris...',
  })
  @IsString()
  body: string;
}
