import { Injectable, NotFoundException } from '@nestjs/common';
import { StatusParcela } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParcelaDto, UpdateParcelaDto } from './dto/parcela.dto';

@Injectable()
export class ParcelasService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateParcelaDto) {
    return this.prisma.parcela.create({
      data: {
        vendaId: dto.vendaId,
        numero: dto.numero,
        valor: dto.valor,
        vencimento: new Date(dto.vencimento),
        observacoes: dto.observacoes,
      },
      include: { venda: { include: { comprador: true, veiculo: true } } },
    });
  }

  findAll(filters: { vendaId?: string; status?: StatusParcela }) {
    return this.prisma.parcela.findMany({
      where: {
        ...(filters.vendaId ? { vendaId: filters.vendaId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: [{ vencimento: 'asc' }],
      include: { venda: { include: { comprador: true, veiculo: true } } },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.parcela.findUnique({
      where: { id },
      include: { venda: { include: { comprador: true, veiculo: true } } },
    });
    if (!p) throw new NotFoundException('Parcela nao encontrada.');
    return p;
  }

  async update(id: string, dto: UpdateParcelaDto) {
    await this.findOne(id);
    return this.prisma.parcela.update({
      where: { id },
      data: {
        ...(dto.vencimento ? { vencimento: new Date(dto.vencimento) } : {}),
        ...(dto.valor != null ? { valor: dto.valor } : {}),
        ...(dto.status ? { status: dto.status as StatusParcela } : {}),
        ...(dto.dataPagamento ? { dataPagamento: new Date(dto.dataPagamento) } : {}),
        ...(dto.observacoes !== undefined ? { observacoes: dto.observacoes } : {}),
      },
      include: { venda: { include: { comprador: true, veiculo: true } } },
    });
  }

  async marcarPago(id: string) {
    await this.findOne(id);
    return this.prisma.parcela.update({
      where: { id },
      data: { status: StatusParcela.PAGO, dataPagamento: new Date() },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.parcela.delete({ where: { id } });
  }

  /** Atualiza para ATRASADO todas as parcelas vencidas ainda PENDENTE. */
  async sincronizarAtrasadas() {
    const agora = new Date();
    const { count } = await this.prisma.parcela.updateMany({
      where: { status: StatusParcela.PENDENTE, vencimento: { lt: agora } },
      data: { status: StatusParcela.ATRASADO },
    });
    return { atualizadas: count };
  }

  /** Retorna parcelas vencidas (ATRASADO ou PENDENTE com vencimento passado). */
  findVencidas() {
    const agora = new Date();
    return this.prisma.parcela.findMany({
      where: {
        OR: [
          { status: StatusParcela.ATRASADO },
          { status: StatusParcela.PENDENTE, vencimento: { lt: agora } },
        ],
      },
      include: { venda: { include: { comprador: true, veiculo: true } } },
      orderBy: { vencimento: 'asc' },
    });
  }

  /** Parcelas com vencimento nos proximos N dias. */
  findProximasVencer(dias = 3) {
    const agora = new Date();
    const limite = new Date(agora.getTime() + dias * 86400000);
    return this.prisma.parcela.findMany({
      where: {
        status: StatusParcela.PENDENTE,
        vencimento: { gte: agora, lte: limite },
      },
      include: { venda: { include: { comprador: true, veiculo: true } } },
      orderBy: { vencimento: 'asc' },
    });
  }

  resumo() {
    return this.prisma.parcela.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { valor: true },
    });
  }
}
