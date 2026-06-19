import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoLancamento } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { QueryLancamentoDto } from './dto/query-lancamento.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { filialParaCriar, filialWhere } from '../common/filial-scope';

/** Categorias padrão do PRD (RF-03). */
export const CATEGORIAS = {
  ENTRADA: ['Venda de veículo', 'Entrada parcial / sinal', 'Financiamento liberado', 'Outros'],
  SAIDA: [
    'Compra de veículo',
    'Despesas com veículo',
    'Despesas administrativas',
    'Comissão de vendedores',
    'Outros',
  ],
};

@Injectable()
export class CashflowService {
  constructor(private readonly prisma: PrismaService) {}

  categorias() {
    return CATEGORIAS;
  }

  create(dto: CreateLancamentoDto, user: AuthUser) {
    const filialId = filialParaCriar(user, dto.filialId);
    return this.prisma.lancamento.create({
      data: {
        tipo: dto.tipo,
        valor: dto.valor,
        data: new Date(dto.data),
        categoria: dto.categoria,
        descricao: dto.descricao,
        formaPagamento: dto.formaPagamento,
        veiculoId: dto.veiculoId,
        clienteId: dto.clienteId,
        filialId,
      },
    });
  }

  async findAll(query: QueryLancamentoDto, user: AuthUser) {
    const lancamentos = await this.prisma.lancamento.findMany({
      where: this.buildWhere(query, user),
      orderBy: { data: 'desc' },
      include: {
        veiculo: { select: { id: true, marca: true, modelo: true, placa: true } },
        cliente: { select: { id: true, nome: true } },
      },
    });
    return lancamentos.map((l) => ({ ...l, valor: Number(l.valor) }));
  }

  /** Resumo do período: total de entradas, saídas e saldo (RF-03). */
  async resumo(query: QueryLancamentoDto, user: AuthUser) {
    const where = this.buildWhere(query, user);
    const [entradas, saidas] = await Promise.all([
      this.prisma.lancamento.aggregate({
        where: { ...where, tipo: TipoLancamento.ENTRADA },
        _sum: { valor: true },
      }),
      this.prisma.lancamento.aggregate({
        where: { ...where, tipo: TipoLancamento.SAIDA },
        _sum: { valor: true },
      }),
    ]);

    const totalEntradas = Number(entradas._sum.valor ?? 0);
    const totalSaidas = Number(saidas._sum.valor ?? 0);
    return {
      totalEntradas,
      totalSaidas,
      saldo: Number((totalEntradas - totalSaidas).toFixed(2)),
    };
  }

  /** Saldo acumulado de todo o histórico (valor total em caixa). */
  async saldoAtual(user: AuthUser, filialId?: string) {
    return this.resumo({ filialId }, user);
  }

  async remove(id: string) {
    const existe = await this.prisma.lancamento.findUnique({ where: { id }, select: { id: true } });
    if (!existe) {
      throw new NotFoundException('Lançamento não encontrado.');
    }
    await this.prisma.lancamento.delete({ where: { id } });
    return { removido: true };
  }

  private buildWhere(query: QueryLancamentoDto, user: AuthUser): Prisma.LancamentoWhereInput {
    const where: Prisma.LancamentoWhereInput = { ...filialWhere(user, query.filialId) };
    if (query.tipo) where.tipo = query.tipo;
    if (query.categoria) where.categoria = query.categoria;
    if (query.inicio || query.fim) {
      where.data = {};
      if (query.inicio) where.data.gte = new Date(query.inicio);
      if (query.fim) where.data.lte = new Date(query.fim);
    }
    return where;
  }
}
