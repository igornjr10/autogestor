import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusDocumento } from '@prisma/client';

export class UpdateDocumentDto {
  @IsOptional()
  @IsEnum(StatusDocumento, { message: 'Status inválido.' })
  status?: StatusDocumento;

  @IsOptional() @IsString()
  observacoes?: string;
}
