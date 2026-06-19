import { Injectable } from '@nestjs/common';
import { SituacaoVeiculo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface PeriodoQuery {
  inicio?: string;
  fim?: string;
  /** Filial efetiva já resolvida pelo controller (undefined = todas). */
  filialId?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private periodo(q: PeriodoQuery) {
    const where: any = {};
    if (q.filialId) where.filialId = q.filialId;
    if (q.inicio || q.fim) {
      where.dataVenda = {};
      if (q.inicio) where.dataVenda.gte = new Date(q.inicio);
      if (q.fim) where.dataVenda.lte = new Date(q.fim);
    }
    return where;
  }

  /** Veículos vendidos no período. */
  async vendas(q: PeriodoQuery) {
    const vendas = await this.prisma.venda.findMany({
      where: this.periodo(q),
      orderBy: { dataVenda: 'desc' },
      include: {
        veiculo: { select: { marca: true, modelo: true, placa: true } },
        comprador: { select: { nome: true } },
        vendedor: { select: { nome: true } },
      },
    });
    return vendas.map((v) => ({
      data: v.dataVenda,
      veiculo: `${v.veiculo.marca} ${v.veiculo.modelo}`,
      placa: v.veiculo.placa,
      comprador: v.comprador.nome,
      vendedor: v.vendedor.nome,
      formaPagamento: v.formaPagamento,
      valor: Number(v.valorTotal),
      custo: Number(v.custoTotalSnapshot),
      lucro: Number(v.valorTotal) - Number(v.custoTotalSnapshot),
    }));
  }

  /** Faturamento e lucro consolidados do período. */
  async faturamento(q: PeriodoQuery) {
    const vendas = await this.vendas(q);
    const faturamento = vendas.reduce((a, v) => a + v.valor, 0);
    const custo = vendas.reduce((a, v) => a + v.custo, 0);
    const lucro = faturamento - custo;
    return {
      quantidade: vendas.length,
      faturamento: Number(faturamento.toFixed(2)),
      custo: Number(custo.toFixed(2)),
      lucro: Number(lucro.toFixed(2)),
    };
  }

  /** Lucro por veículo vendido. */
  async lucroPorVeiculo(q: PeriodoQuery) {
    const vendas = await this.vendas(q);
    return vendas.map((v) => ({
      veiculo: v.veiculo,
      placa: v.placa,
      valor: v.valor,
      custo: v.custo,
      lucro: v.lucro,
    }));
  }

  /** Ranking de vendedores no período. */
  async rankingVendedores(q: PeriodoQuery) {
    const grupos = await this.prisma.venda.groupBy({
      by: ['vendedorId'],
      where: this.periodo(q),
      _sum: { valorTotal: true },
      _count: { _all: true },
    });
    if (grupos.length === 0) return [];
    const vendedores = await this.prisma.usuario.findMany({
      where: { id: { in: grupos.map((g) => g.vendedorId) } },
      select: { id: true, nome: true },
    });
    const nome = new Map(vendedores.map((u) => [u.id, u.nome]));
    return grupos
      .map((g) => ({
        vendedor: nome.get(g.vendedorId) ?? '—',
        quantidade: g._count._all,
        faturamento: Number(g._sum.valorTotal ?? 0),
      }))
      .sort((a, b) => b.faturamento - a.faturamento);
  }

  /** Estoque disponível (não vendidos). */
  async estoqueDisponivel(filialId?: string) {
    const veiculos = await this.prisma.veiculo.findMany({
      where: { situacao: { not: SituacaoVeiculo.VENDIDO }, ...(filialId ? { filialId } : {}) },
      orderBy: { dataEntrada: 'asc' },
      include: { custos: true },
    });
    return veiculos.map((v) => {
      const custoTotal = Number(v.valorCompra) + v.custos.reduce((a, c) => a + Number(c.valor), 0);
      const dias = Math.floor((Date.now() - new Date(v.dataEntrada).getTime()) / 86400000);
      return {
        veiculo: `${v.marca} ${v.modelo}`,
        placa: v.placa,
        situacao: v.situacao,
        dataEntrada: v.dataEntrada,
        diasEmEstoque: dias,
        custoTotal: Number(custoTotal.toFixed(2)),
        valorVendaSugerido: v.valorVendaSugerido != null ? Number(v.valorVendaSugerido) : null,
      };
    });
  }

  /** Veículos mais antigos em estoque (ordenados por dias). */
  async maisAntigos(filialId?: string) {
    const estoque = await this.estoqueDisponivel(filialId);
    return [...estoque].sort((a, b) => b.diasEmEstoque - a.diasEmEstoque);
  }

  /** Custo médio de aquisição dos veículos. */
  async custoMedio(filialId?: string) {
    const agg = await this.prisma.veiculo.aggregate({
      where: filialId ? { filialId } : undefined,
      _avg: { valorCompra: true },
      _count: { _all: true },
    });
    return {
      totalVeiculos: agg._count._all,
      custoMedioAquisicao: Number(Number(agg._avg.valorCompra ?? 0).toFixed(2)),
    };
  }
}
