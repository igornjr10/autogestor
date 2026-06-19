import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SituacaoVeiculo } from '@prisma/client';

export class QueryVehicleDto {
  @IsOptional()
  @IsEnum(SituacaoVeiculo, { message: 'Situação inválida.' })
  situacao?: SituacaoVeiculo;

  @IsOptional()
  @IsString()
  marca?: string;

  /** Busca por placa ou chassi (parcial, case-insensitive). */
  @IsOptional()
  @IsString()
  busca?: string;

  /** Filtro por filial (apenas para usuário global/ADMIN). */
  @IsOptional()
  @IsString()
  filialId?: string;
}
