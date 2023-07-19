import { ApiProperty } from '@nestjs/swagger';

class FinancialData {
  @ApiProperty()
  Faturamento: Record<string, string>;

  @ApiProperty()
  Receita: Record<string, string>;

  @ApiProperty()
  LTV: Record<string, string>;

  @ApiProperty()
  CAC: Record<string, string>;
}

export class SheetFinancialDataDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: [FinancialData] })
  data: FinancialData[];

  @ApiProperty()
  spreadSheetId: string;

  @ApiProperty()
  spreadSheetName: string;

  @ApiProperty()
  spreadSheetTableName: string;

  @ApiProperty()
  usuarioId: string;

  @ApiProperty()
  criadoEm: string;

  @ApiProperty()
  atualizadoEm: string;
}

export class SheetFinancialWithoutDataDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  spreadSheetId: string;

  @ApiProperty()
  spreadSheetName: string;

  @ApiProperty()
  spreadSheetTableName: string;

  @ApiProperty()
  usuarioId: string;

  @ApiProperty()
  criadoEm: string;

  @ApiProperty()
  atualizadoEm: string;
}
