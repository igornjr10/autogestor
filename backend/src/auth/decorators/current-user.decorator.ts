import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  perfil: string;
  filialId: string | null;
}

/** Injeta o usuário autenticado (payload do JWT) no handler. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);
