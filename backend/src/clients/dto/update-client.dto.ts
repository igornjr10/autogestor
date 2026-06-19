import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { TipoCliente } from '@prisma/client';

export class UpdateClientDto {
  @IsOptional() @IsString() @MinLength(2)
  nome?: string;

  @IsOptional() @IsString() @MinLength(11)
  cpfCnpj?: string;

  @IsOptional() @IsString()
  rg?: string;

  @IsOptional() @IsString()
  cnh?: string;

  @IsOptional() @IsDateString()
  dataNascimento?: string;

  @IsOptional() @IsString()
  telefone?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  endereco?: string;

  @IsOptional() @IsEnum(TipoCliente)
  tipo?: TipoCliente;

  @IsOptional() @IsString()
  observacoes?: string;
}
