import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFilialDto, UpdateFilialDto } from './dto/filial.dto';

@Injectable()
export class FiliaisService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFilialDto) {
    return this.prisma.filial.create({ data: dto });
  }

  findAll() {
    return this.prisma.filial.findMany({ orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const filial = await this.prisma.filial.findUnique({ where: { id } });
    if (!filial) throw new NotFoundException('Filial não encontrada.');
    return filial;
  }

  async update(id: string, dto: UpdateFilialDto) {
    await this.findOne(id);
    return this.prisma.filial.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    const [veiculos, usuarios] = await Promise.all([
      this.prisma.veiculo.count({ where: { filialId: id } }),
      this.prisma.usuario.count({ where: { filialId: id } }),
    ]);
    if (veiculos > 0 || usuarios > 0) {
      throw new ConflictException('Não é possível excluir uma filial com veículos ou usuários vinculados. Desative-a.');
    }
    await this.prisma.filial.delete({ where: { id } });
    return { removido: true };
  }
}
