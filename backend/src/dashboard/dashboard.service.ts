import { Injectable } from '@nestjs/common';
import { SituacaoVeiculo, TipoLancamento } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { filialWhere } from '../common/filial-scope';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(user: AuthUser, filialIdQuery?: string) {
    const fScope = filialWhere(user, filialIdQuery);
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioProxMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

    const [
      emEstoque,
      distribuicao,
      vendasMes,
      entradas,
      saidas,
      vendasUltimos12,
      vendedores,
    ] = await Promise.all([
      // Total em estoque = não vendidos (DISPONIVEL + RESERVADO)
      this.prisma.veiculo.count({ where: { ...fScope, situacao: { not: SituacaoVeiculo.VENDIDO } } }),
      this.prisma.veiculo.groupBy({ by: ['situacao'], where: fScope, _count: { _all: true } }),
      this.prisma.venda.findMany({
        where: { ...fScope, dataVenda: { gte: inicioMes, lt: inicioProxMes } },
        select: { valorTotal: true, custoTotalSnapshot: true },
      }),
      this.prisma.lancamento.aggregate({
        where: { ...fScope, tipo: TipoLancamento.ENTRADA },
        _sum: { valor: true },
      }),
      this.prisma.lancamento.aggregate({
        where: { ...fScope, tipo: TipoLancamento.SAIDA },
        _sum: { valor: true },
      }),
      this.vendasParaSerie(fScope),
      this.rankingVendedores(inicioMes, inicioProxMes, fScope),
    ]);

    const faturamentoMes = vendasMes.reduce((acc, v) => acc + Number(v.valorTotal), 0);
    const lucroMes = vendasMes.reduce(
      (acc, v) => acc + (Number(v.valorTotal) - Number(v.custoTotalSnapshot)),
      0,
    );
    const saldoCaixa = Number(entradas._sum.valor ?? 0) - Number(saidas._sum.valor ?? 0);

    const distribuicaoSituacao = { DISPONIVEL: 0, RESERVADO: 0, VENDIDO: 0 } as Record<string, number>;
    distribuicao.forEach((d) => {
      distribuicaoSituacao[d.situacao] = d._count._all;
    });

    return {
      cards: {
        veiculosEmEstoque: emEstoque,
        vendidosNoMes: vendasMes.length,
        faturamentoMes: Number(faturamentoMes.toFixed(2)),
        lucroBrutoMes: Number(lucroMes.toFixed(2)),
        saldoCaixa: Number(saldoCaixa.toFixed(2)),
        // Documentação pendente entra na Sprint 4 (RF-07); por ora, 0.
        documentacaoPendente: 0,
      },
      distribuicaoSituacao,
      vendasPorMes: vendasUltimos12,
      rankingVendedores: vendedores,
    };
  }

  /** Série dos últimos 12 meses: faturamento, custo e lucro. */
  private async vendasParaSerie(fScope: { filialId?: string }) {
    const agora = new Date();
    const inicio = new Date(agora.getFullYear(), agora.getMonth() - 11, 1);

    const vendas = await this.prisma.venda.findMany({
      where: { ...fScope, dataVenda: { gte: inicio } },
      select: { dataVenda: true, valorTotal: true, custoTotalSnapshot: true },
    });

    // Inicializa os 12 buckets (mais antigo → atual)
    const buckets: { mes: string; faturamento: number; custo: number; lucro: number; qtd: number }[] = [];
    const indexPorChave = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - 11 + i, 1);
      const chave = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      indexPorChave.set(chave, buckets.length);
      buckets.push({ mes: label, faturamento: 0, custo: 0, lucro: 0, qtd: 0 });
    }

    vendas.forEach((v) => {
      const d = new Date(v.dataVenda);
      const chave = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = indexPorChave.get(chave);
      if (idx === undefined) return;
      const fat = Number(v.valorTotal);
      const custo = Number(v.custoTotalSnapshot);
      buckets[idx].faturamento += fat;
      buckets[idx].custo += custo;
      buckets[idx].lucro += fat - custo;
      buckets[idx].qtd += 1;
    });

    return buckets.map((b) => ({
      mes: b.mes,
      faturamento: Number(b.faturamento.toFixed(2)),
      custo: Number(b.custo.toFixed(2)),
      lucro: Number(b.lucro.toFixed(2)),
      qtd: b.qtd,
    }));
  }

  /** Ranking de vendedores no mês corrente. */
  private async rankingVendedores(inicio: Date, fim: Date, fScope: { filialId?: string }) {
    const grupos = await this.prisma.venda.groupBy({
      by: ['vendedorId'],
      where: { ...fScope, dataVenda: { gte: inicio, lt: fim } },
      _sum: { valorTotal: true },
      _count: { _all: true },
    });

    if (grupos.length === 0) return [];

    const vendedores = await this.prisma.usuario.findMany({
      where: { id: { in: grupos.map((g) => g.vendedorId) } },
      select: { id: true, nome: true },
    });
    const nomePorId = new Map(vendedores.map((u) => [u.id, u.nome]));

    return grupos
      .map((g) => ({
        nome: nomePorId.get(g.vendedorId) ?? 'Desconhecido',
        faturamento: Number(g._sum.valorTotal ?? 0),
        quantidade: g._count._all,
      }))
      .sort((a, b) => b.faturamento - a.faturamento);
  }
}
