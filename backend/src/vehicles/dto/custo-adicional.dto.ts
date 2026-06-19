import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CustoAdicionalDto {
  @IsString()
  @MinLength(2)
  descricao: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor inválido.' })
  @IsPositive({ message: 'O valor deve ser positivo.' })
  valor: number;
}
