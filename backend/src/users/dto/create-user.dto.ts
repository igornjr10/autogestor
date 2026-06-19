import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Perfil } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter ao menos 6 caracteres.' })
  senha: string;

  @IsEnum(Perfil, { message: 'Perfil inválido.' })
  perfil: Perfil;

  // Filial do usuário. Deixe vazio para acesso global (recomendado apenas para ADMIN).
  @IsOptional()
  @IsString()
  filialId?: string;
}
