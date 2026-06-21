import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class PlacaFipeDto {
  @IsString()
  @Matches(/^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$/, {
    message: 'placa deve estar no formato ABC1234 ou ABC1D23.',
  })
  placa!: string;

  @IsOptional()
  @IsBoolean()
  homolog?: boolean;
}
