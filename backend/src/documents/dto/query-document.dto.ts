import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StatusDocumento } from '@prisma/client';

export class QueryDocumentDto {
  @IsOptional()
  @IsUUID('4')
  veiculoId?: string;

  @IsOptional()
  @IsUUID('4')
  clienteId?: string;

  @IsOptional()
  @IsEnum(StatusDocumento)
  status?: StatusDocumento;
}
