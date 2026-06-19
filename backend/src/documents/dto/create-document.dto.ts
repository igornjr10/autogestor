import { IsOptional, IsString, IsUUID, MinLength, ValidateIf } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @MinLength(2, { message: 'Informe o tipo do documento.' })
  tipo: string;

  @IsOptional() @IsString()
  observacoes?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Veículo inválido.' })
  veiculoId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Cliente inválido.' })
  clienteId?: string;

  // Garante que o documento esteja vinculado a um veículo OU cliente
  @ValidateIf((o) => !o.veiculoId && !o.clienteId)
  @IsString({ message: 'Vincule o documento a um veículo ou cliente.' })
  readonly _vinculo?: string;
}
