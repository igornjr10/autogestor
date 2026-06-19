import { IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class FotoDto {
  @IsString()
  @IsUrl({}, { message: 'URL da foto inválida.' })
  url: string;

  @IsOptional()
  @IsString()
  legenda?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}
