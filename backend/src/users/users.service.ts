import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const SAFE_SELECT = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  filialId: true,
  criadoEm: true,
  atualizadoEm: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existente = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existente) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    return this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        perfil: dto.perfil,
        filialId: dto.filialId ?? null,
      },
      select: SAFE_SELECT,
    });
  }

  findAll() {
    return this.prisma.usuario.findMany({
      select: SAFE_SELECT,
      orderBy: { nome: 'asc' },
    });
  }
}
