import { BadRequestException, Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Perfil } from '@prisma/client';
import { ReportsService, PeriodoQuery } from './reports.service';
import { ExportService, Coluna } from './export.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { filialWhere } from '../common/filial-scope';

const moeda = (v: any) =>
  v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
const data = (v: any) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—');

// Definição de colunas e título por tipo de relatório (para exportação)
const RELATORIOS: Record<string, { titulo: string; colunas: Coluna[] }> = {
  vendas: {
    titulo: 'Veículos Vendidos',
    colunas: [
      { header: 'Data', key: 'data', format: data },
      { header: 'Veículo', key: 'veiculo' },
      { header: 'Placa', key: 'placa' },
      { header: 'Comprador', key: 'comprador' },
      { header: 'Vendedor', key: 'vendedor' },
      { header: 'Pagamento', key: 'formaPagamento' },
      { header: 'Valor', key: 'valor', format: moeda },
      { header: 'Lucro', key: 'lucro', format: moeda },
    ],
  },
  'lucro-veiculo': {
    titulo: 'Lucro por Veículo',
    colunas: [
      { header: 'Veículo', key: 'veiculo' },
      { header: 'Placa', key: 'placa' },
      { header: 'Valor', key: 'valor', format: moeda },
      { header: 'Custo', key: 'custo', format: moeda },
      { header: 'Lucro', key: 'lucro', format: moeda },
    ],
  },
  ranking: {
    titulo: 'Ranking de Vendedores',
    colunas: [
      { header: 'Vendedor', key: 'vendedor' },
      { header: 'Qtd. vendas', key: 'quantidade' },
      { header: 'Faturamento', key: 'faturamento', format: moeda },
    ],
  },
  estoque: {
    titulo: 'Estoque Disponível',
    colunas: [
      { header: 'Veículo', key: 'veiculo' },
      { header: 'Placa', key: 'placa' },
      { header: 'Situação', key: 'situacao' },
      { header: 'Entrada', key: 'dataEntrada', format: data },
      { header: 'Dias em estoque', key: 'diasEmEstoque' },
      { header: 'Custo total', key: 'custoTotal', format: moeda },
    ],
  },
  'mais-antigos': {
    titulo: 'Veículos Mais Antigos em Estoque',
    colunas: [
      { header: 'Veículo', key: 'veiculo' },
      { header: 'Placa', key: 'placa' },
      { header: 'Dias em estoque', key: 'diasEmEstoque' },
      { header: 'Entrada', key: 'dataEntrada', format: data },
    ],
  },
};

@Controller('relatorios')
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly exporter: ExportService,
  ) {}

  /** Resolve a filial efetiva a partir do usuário (escopo) e do filtro informado. */
  private comFilial(user: AuthUser, q: PeriodoQuery): PeriodoQuery {
    return { ...q, filialId: filialWhere(user, q.filialId).filialId };
  }

  @Get('vendas')
  vendas(@Query() q: PeriodoQuery, @CurrentUser() user: AuthUser) {
    return this.reports.vendas(this.comFilial(user, q));
  }

  @Get('faturamento')
  faturamento(@Query() q: PeriodoQuery, @CurrentUser() user: AuthUser) {
    return this.reports.faturamento(this.comFilial(user, q));
  }

  @Get('lucro-veiculo')
  lucroVeiculo(@Query() q: PeriodoQuery, @CurrentUser() user: AuthUser) {
    return this.reports.lucroPorVeiculo(this.comFilial(user, q));
  }

  @Get('ranking')
  ranking(@Query() q: PeriodoQuery, @CurrentUser() user: AuthUser) {
    return this.reports.rankingVendedores(this.comFilial(user, q));
  }

  @Get('estoque')
  estoque(@CurrentUser() user: AuthUser, @Query('filialId') filialId?: string) {
    return this.reports.estoqueDisponivel(filialWhere(user, filialId).filialId);
  }

  @Get('mais-antigos')
  maisAntigos(@CurrentUser() user: AuthUser, @Query('filialId') filialId?: string) {
    return this.reports.maisAntigos(filialWhere(user, filialId).filialId);
  }

  @Get('custo-medio')
  custoMedio(@CurrentUser() user: AuthUser, @Query('filialId') filialId?: string) {
    return this.reports.custoMedio(filialWhere(user, filialId).filialId);
  }

  /** Exporta um relatório em Excel ou PDF. */
  @Get(':tipo/export')
  async export(
    @Param('tipo') tipo: string,
    @Query('formato') formato: string,
    @Query() q: PeriodoQuery,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const def = RELATORIOS[tipo];
    if (!def) throw new BadRequestException('Relatório inválido para exportação.');

    const linhas = await this.dados(tipo, this.comFilial(user, q));
    const fmt = (formato ?? 'excel').toLowerCase();

    if (fmt === 'pdf') {
      const pdf = await this.exporter.toPdf(def.titulo, def.colunas, linhas);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${tipo}.pdf"`);
      return res.end(pdf);
    }

    const xlsx = await this.exporter.toExcel(def.titulo, def.colunas, linhas);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${tipo}.xlsx"`);
    return res.end(xlsx);
  }

  private dados(tipo: string, q: PeriodoQuery) {
    switch (tipo) {
      case 'vendas':
        return this.reports.vendas(q);
      case 'lucro-veiculo':
        return this.reports.lucroPorVeiculo(q);
      case 'ranking':
        return this.reports.rankingVendedores(q);
      case 'estoque':
        return this.reports.estoqueDisponivel(q.filialId);
      case 'mais-antigos':
        return this.reports.maisAntigos(q.filialId);
      default:
        return Promise.resolve([]);
    }
  }
}
