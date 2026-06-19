import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Combustivel, SituacaoVeiculo } from '@prisma/client';

const ANO_MAX = 2100;

/**
 * Atualização de veículo. Todos os campos são opcionais.
 * A situação pode ir para DISPONIVEL ou RESERVADO; marcar como VENDIDO
 * acontece pelo módulo de Venda (RF-02), fora do escopo deste sprint.
 */
export class UpdateVehicleDto {
  @IsOptional() @IsString() @MinLength(7)
  placa?: string;

  @IsOptional() @IsString() @MinLength(9)
  renavam?: string;

  @IsOptional() @IsString()
  marca?: string;

  @IsOptional() @IsString()
  modelo?: string;

  @IsOptional() @IsInt() @Min(1900) @Max(ANO_MAX)
  anoFabricacao?: number;

  @IsOptional() @IsInt() @Min(1900) @Max(ANO_MAX)
  anoModelo?: number;

  @IsOptional() @IsString()
  cor?: string;

  @IsOptional() @IsEnum(Combustivel)
  combustivel?: Combustivel;

  @IsOptional() @IsInt() @Min(0)
  quilometragem?: number;

  @IsOptional() @IsDateString()
  dataEntrada?: string;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
  valorCompra?: number;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
  valorVendaSugerido?: number;

  @IsOptional() @IsString()
  observacoes?: string;

  @IsOptional()
  @IsEnum([SituacaoVeiculo.DISPONIVEL, SituacaoVeiculo.RESERVADO], {
    message: 'Situação deve ser DISPONIVEL ou RESERVADO. Use o módulo de venda para marcar como VENDIDO.',
  })
  situacao?: SituacaoVeiculo;

  @IsOptional() @IsString() @MinLength(2)
  propNome?: string;

  @IsOptional() @IsString() @MinLength(11)
  propCpfCnpj?: string;

  @IsOptional() @IsString()
  propTelefone?: string;

  @IsOptional() @IsString()
  propEndereco?: string;
}
