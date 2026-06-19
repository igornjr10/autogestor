import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TipoCliente } from '@prisma/client';

export class QueryClientDto {
  @IsOptional()
  @IsEnum(TipoCliente, { message: 'Tipo de cliente inválido.' })
  tipo?: TipoCliente;

  /** Busca por nome, CPF/CNPJ ou e-mail (parcial, case-insensitive). */
  @IsOptional()
  @IsString()
  busca?: string;
}
