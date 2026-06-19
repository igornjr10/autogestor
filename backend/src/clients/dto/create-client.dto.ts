import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TipoCliente } from '@prisma/client';

export class CreateClientDto {
  @IsString()
  @MinLength(2, { message: 'Informe o nome / razão social.' })
  nome: string;

  @IsString()
  @MinLength(11, { message: 'CPF/CNPJ inválido.' })
  cpfCnpj: string;

  @IsOptional() @IsString()
  rg?: string;

  @IsOptional() @IsString()
  cnh?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de nascimento inválida.' })
  dataNascimento?: string;

  @IsOptional() @IsString()
  telefone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido.' })
  email?: string;

  @IsOptional() @IsString()
  endereco?: string;

  @IsOptional()
  @IsEnum(TipoCliente, { message: 'Tipo de cliente inválido.' })
  tipo?: TipoCliente;

  @IsOptional() @IsString()
  observacoes?: string;
}
