import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFilialDto {
  @IsString()
  @MinLength(2, { message: 'Informe o nome da filial.' })
  nome: string;

  @IsOptional() @IsString()
  cnpj?: string;

  @IsOptional() @IsString()
  endereco?: string;

  @IsOptional() @IsString()
  telefone?: string;
}

export class UpdateFilialDto {
  @IsOptional() @IsString() @MinLength(2)
  nome?: string;

  @IsOptional() @IsString()
  cnpj?: string;

  @IsOptional() @IsString()
  endereco?: string;

  @IsOptional() @IsString()
  telefone?: string;

  @IsOptional() @IsBoolean()
  ativa?: boolean;
}
