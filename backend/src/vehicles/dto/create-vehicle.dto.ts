import {
  IsArray,
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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Combustivel } from '@prisma/client';
import { CustoAdicionalDto } from './custo-adicional.dto';
import { FotoDto } from './foto.dto';

const ANO_MAX = 2100;

export class CreateVehicleDto {
  @IsString()
  @MinLength(7, { message: 'Placa inválida.' })
  placa: string;

  @IsOptional()
  @IsString()
  @MinLength(9, { message: 'Renavam inválido.' })
  renavam?: string;

  @IsString()
  @MinLength(17, { message: 'Chassi deve ter 17 caracteres.' })
  chassi: string;

  @IsString()
  marca: string;

  @IsString()
  modelo: string;

  @IsInt()
  @Min(1900)
  @Max(ANO_MAX)
  anoFabricacao: number;

  @IsInt()
  @Min(1900)
  @Max(ANO_MAX)
  anoModelo: number;

  @IsString()
  cor: string;

  @IsEnum(Combustivel, { message: 'Combustível inválido.' })
  combustivel: Combustivel;

  @IsInt()
  @Min(0)
  quilometragem: number;

  @IsDateString({}, { message: 'Data de entrada inválida.' })
  dataEntrada: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'O valor de compra deve ser positivo.' })
  valorCompra: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  valorVendaSugerido?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;

  // Antigo proprietário
  @IsOptional()
  @IsString()
  @MinLength(2)
  propNome?: string;

  @IsOptional()
  @IsString()
  @MinLength(11, { message: 'CPF/CNPJ inválido.' })
  propCpfCnpj?: string;

  @IsOptional()
  @IsString()
  propTelefone?: string;

  @IsOptional()
  @IsString()
  propEndereco?: string;

  // Filial do veículo (obrigatório para usuário global/ADMIN; ignorado para usuário de filial)
  @IsOptional()
  @IsString()
  filialId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustoAdicionalDto)
  custos?: CustoAdicionalDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FotoDto)
  fotos?: FotoDto[];
}
