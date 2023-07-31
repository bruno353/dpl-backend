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

export class GetTaskEventsResponseDto {
  @IsString()
  @ApiProperty({
    description: 'The event name',
    example: 'TaskCreated',
  })
  name: string;

  @IsString()
  @ApiProperty({
    description: 'The event data',
    example:
      '{"taskId":"0","applicationId":"3","proposer":"0x0DD7167d9707faFE0837c0b1fe12348AfAabF170","msgSender":"0x0DD7167d9707faFE0837c0b1fe12348AfAabF170","metadata":"QmNVasxcx7fEzLRJGTd1pmKdKXo4sUD3FTjhxxYHBaDCFh","reward":"[[true,"0x0DD7167d9707faFE0837c0b1fe12348AfAabF170",{"type":"BigNumber","hex":"0x056bc75e2d63100000"}]]","blockNumber":"38466662","blockHash":"0x84bd2142d185b611b6aff179a72075b4a1dc3397cfeb31c1bef5a94be4712762","timestamp":"1690757233876","event":"ApplicationCreated","transactionHash":"0xdb5ed6441db61a79dc4c9b477c51fb94c31ad92dd0697e5a9d2702699f02f0b1","contractAddress":"0x52Eb52C0723C35145608B46879Ad84Fe2bf84239"}',
  })
  data: string;

  @IsString()
  @ApiProperty({
    description: 'The event log index',
    example: '42',
  })
  eventIndex: string;

  @IsString()
  @ApiProperty({
    description: 'The event transaction hash',
    example: '0x08ADb3400E48cACb7d5a5CB386877B3A159d525C',
  })
  transactionHash: string;

  @IsString()
  @ApiProperty({
    description: 'The event block number',
    example: '32',
  })
  metadablockNumbertaDescription: string;

  @IsString()
  @ApiProperty({
    description: 'If the event is related to a task, returns the task id',
    example: '98',
  })
  taskId: number;

  @IsOptional()
  @ApiProperty({
    description:
      'Some address  related to the event (msg.sender / application sender etc)',
    example: '0x08ADb3400E48cACb7d5a5CB386877B3A159d525C',
  })
  address: string;

  @IsString()
  @ApiProperty({
    description:
      'Timestamp Unix global in seconds of when the event was emitted',
    example: '16904383',
  })
  timestamp: string;
}
