import { BadRequestException } from '@nestjs/common';
import { AuthUser } from '../auth/decorators/current-user.decorator';

/**
 * Resolve o filtro de filial para LEITURA.
 * - Usuário com filial → sempre restrito à sua filial.
 * - ADMIN/global (sem filial) → vê tudo, ou filtra pela filial informada (query).
 * Retorna `{}` (sem filtro) ou `{ filialId }`.
 */
export function filialWhere(user: AuthUser, filialIdQuery?: string): { filialId?: string } {
  if (user.filialId) return { filialId: user.filialId };
  if (filialIdQuery) return { filialId: filialIdQuery };
  return {};
}

/**
 * Resolve a filial para CRIAÇÃO de um registro.
 * - Usuário com filial → usa a própria filial.
 * - ADMIN/global → precisa informar a filial (body/query).
 */
export function filialParaCriar(user: AuthUser, filialIdInput?: string): string {
  const filialId = user.filialId ?? filialIdInput;
  if (!filialId) {
    throw new BadRequestException('Informe a filial (usuário global deve selecionar uma filial).');
  }
  return filialId;
}
