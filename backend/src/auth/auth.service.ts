import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaConfere) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      filialId: usuario.filialId,
    };

    return {
      ...(await this.gerarTokens(payload)),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        filialId: usuario.filialId,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      // Garante que o usuário ainda existe e está ativo
      const usuario = await this.prisma.usuario.findUnique({ where: { id: payload.sub } });
      if (!usuario || !usuario.ativo) {
        throw new UnauthorizedException();
      }

      return this.gerarTokens({
        sub: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
        filialId: usuario.filialId,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
  }

  private async gerarTokens(payload: JwtPayload) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES', '15m'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES', '7d'),
    });

    return { accessToken, refreshToken };
  }
}
