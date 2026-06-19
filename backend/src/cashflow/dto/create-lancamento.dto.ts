import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { TipoLancamento } from '@prisma/client';

export class CreateLancamentoDto {
  @IsEnum(TipoLancamento, { message: 'Tipo deve ser ENTRADA ou SAIDA.' })
  tipo: TipoLancamento;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor inválido.' })
  @IsPositive({ message: 'O valor deve ser positivo.' })
  valor: number;

  @IsDateString({}, { message: 'Data inválida.' })
  data: string;

  @IsString()
  @MinLength(2, { message: 'Informe a categoria.' })
  categoria: string;

  @IsOptional() @IsString()
  descricao?: string;

  @IsOptional() @IsString()
  formaPagamento?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Veículo inválido.' })
  veiculoId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Cliente inválido.' })
  clienteId?: string;

  // Filial (obrigatório para usuário global/ADMIN)
  @IsOptional()
  @IsString()
  filialId?: string;
}
