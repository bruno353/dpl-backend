import { ApiProperty } from '@nestjs/swagger';

export class FinancialFileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  tipo: string;
}
