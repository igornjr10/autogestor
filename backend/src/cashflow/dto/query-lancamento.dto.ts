import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TipoLancamento } from '@prisma/client';

export class QueryLancamentoDto {
  @IsOptional()
  @IsDateString({}, { message: 'Data inicial inválida.' })
  inicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data final inválida.' })
  fim?: string;

  @IsOptional()
  @IsEnum(TipoLancamento)
  tipo?: TipoLancamento;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  filialId?: string;
}
