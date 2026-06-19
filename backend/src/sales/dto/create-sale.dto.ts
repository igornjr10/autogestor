import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { FormaPagamento } from '@prisma/client';

export class CreateSaleDto {
  @IsUUID('4', { message: 'Veículo inválido.' })
  veiculoId: string;

  @IsUUID('4', { message: 'Comprador inválido.' })
  compradorId: string;

  @IsDateString({}, { message: 'Data da venda inválida.' })
  dataVenda: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor inválido.' })
  @IsPositive({ message: 'O valor total deve ser positivo.' })
  valorTotal: number;

  @IsEnum(FormaPagamento, { message: 'Forma de pagamento inválida.' })
  formaPagamento: FormaPagamento;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
