import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min } from 'class-validator';

export class CreateParcelaDto {
  @IsUUID()
  vendaId: string;

  @IsInt()
  @Min(1)
  numero: number;

  @IsNumber()
  @IsPositive()
  valor: number;

  @IsDateString()
  vencimento: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UpdateParcelaDto {
  @IsOptional()
  @IsDateString()
  vencimento?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  valor?: number;

  @IsOptional()
  @IsIn(['PENDENTE', 'PAGO', 'ATRASADO'])
  status?: 'PENDENTE' | 'PAGO' | 'ATRASADO';

  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
