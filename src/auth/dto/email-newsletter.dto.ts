import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EmailNewsletterDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Email para inscrição na newsletter',
  })
  email: string;
}

export class EmailSaaSMVPDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Email para inscrição na newsletter',
  })
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Feedback do usuário',
  })
  feedback: string;
}
