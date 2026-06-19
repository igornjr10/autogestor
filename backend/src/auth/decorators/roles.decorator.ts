import { SetMetadata } from '@nestjs/common';
import { Perfil } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restringe a rota aos perfis informados. Ex: @Roles('ADMIN', 'VENDEDOR') */
export const Roles = (...roles: Perfil[]) => SetMetadata(ROLES_KEY, roles);
