import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exportRelatorio, getFaturamento, getRelatorio, Periodo } from '../../lib/reports';
import { formatData, formatMoeda } from '../../lib/format';
import { useFilial } from '../../auth/FilialContext';

type TipoRelatorio = 'vendas' | 'lucro-veiculo' | 'ranking' | 'estoque' | 'mais-antigos';

interface ColDef {
  header: string;
  key: string;
  fmt?: (v: any) => string;
}

const moeda = (v: any) => formatMoeda(Number(v));
const data = (v: any) => formatData(v);

const RELATORIOS: Record<TipoRelatorio, { titulo: string; usaPeriodo: boolean; colunas: ColDef[] }> = {
  vendas: {
    titulo: 'Veículos vendidos',
    usaPeriodo: true,
    colunas: [
      { header: 'Data', key: 'data', fmt: data },
      { header: 'Veículo', key: 'veiculo' },
      { header: 'Placa', key: 'placa' },
      { header: 'Comprador', key: 'comprador' },
      { header: 'Vendedor', key: 'vendedor' },
      { header: 'Valor', key: 'valor', fmt: moeda },
      { header: 'Lucro', key: 'lucro', fmt: moeda },
    ],
  },
  'lucro-veiculo': {
    titulo: 'Lucro por veículo',
    usaPeriodo: true,
    colunas: [
      { header: 'Veículo', key: 'veiculo' },
      { header: 'Placa', key: 'placa' },
      { header: 'Valor', key: 'valor', fmt: moeda },
      { header: 'Custo', key: 'custo', fmt: moeda },
      { header: 'Lucro', key: 'lucro', fmt: moeda },
    ],
  },
  ranking: {
    titulo: 'Ranking de vendedores',
    usaPeriodo: true,
    colunas: [
      { header: 'Vendedor', key: 'vendedor' },
      { header: 'Qtd. vendas', key: 'quantidade' },
      { header: 'Faturamento', key: 'faturamento', fmt: moeda },
    ],
  },
  estoque: {
    titulo: 'Estoque disponível',
    usaPeriodo: false,
    colunas: [
      { header: 'Veículo', key: 'veiculo' },
      { header: 'Placa', key: 'placa' },
      { header: 'Situação', key: 'situacao' },
      { header: 'Entrada', key: 'dataEntrada', fmt: data },
      { header: 'Dias', key: 'diasEmEstoque' },
      { header: 'Custo total', key: 'custoTotal', fmt: moeda },
    ],
  },
  'mais-antigos': {
    titulo: 'Veículos mais antigos em estoque',
    usaPeriodo: false,
    colunas: [
      { header: 'Veículo', key: 'veiculo' },
      { header: 'Placa', key: 'placa' },
      { header: 'Dias em estoque', key: 'diasEmEstoque' },
      { header: 'Entrada', key: 'dataEntrada', fmt: data },
    ],
  },
};

export function ReportsPage() {
  const { filialAtiva } = useFilial();
  const [tipo, setTipo] = useState<TipoRelatorio>('vendas');
  const [periodo, setPeriodo] = useState<Periodo>({});
  const [exportando, setExportando] = useState(false);

  const def = RELATORIOS[tipo];
  const periodoEfetivo: Periodo = { ...(def.usaPeriodo ? periodo : {}), filialId: filialAtiva };

  const { data: linhas, isLoading } = useQuery({
    queryKey: ['relatorio', tipo, periodoEfetivo],
    queryFn: () => getRelatorio(tipo, periodoEfetivo),
  });

  const { data: fat } = useQuery({
    queryKey: ['relatorio-faturamento', periodo, filialAtiva],
    queryFn: () => getFaturamento({ ...periodo, filialId: filialAtiva }),
  });

  async function exportar(formato: 'excel' | 'pdf') {
    setExportando(true);
    try {
      await exportRelatorio(tipo, formato, periodoEfetivo);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>

      {/* Resumo do faturamento do período */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Resumo titulo="Vendas" valor={fat ? String(fat.quantidade) : '—'} />
        <Resumo titulo="Faturamento" valor={fat ? formatMoeda(fat.faturamento) : '—'} />
        <Resumo titulo="Custo" valor={fat ? formatMoeda(fat.custo) : '—'} />
        <Resumo titulo="Lucro" valor={fat ? formatMoeda(fat.lucro) : '—'} cor="text-green-600" />
      </div>

      {/* Controles */}
      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <label className="label">Relatório</label>
          <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as TipoRelatorio)}>
            <option value="vendas">Veículos vendidos</option>
            <option value="lucro-veiculo">Lucro por veículo</option>
            <option value="ranking">Ranking de vendedores</option>
            <option value="estoque">Estoque disponível</option>
            <option value="mais-antigos">Mais antigos em estoque</option>
          </select>
        </div>
        <div>
          <label className="label">De</label>
          <input
            className="input"
            type="date"
            disabled={!def.usaPeriodo}
            value={periodo.inicio ?? ''}
            onChange={(e) => setPeriodo((p) => ({ ...p, inicio: e.target.value || undefined }))}
          />
        </div>
        <div>
          <label className="label">Até</label>
          <input
            className="input"
            type="date"
            disabled={!def.usaPeriodo}
            value={periodo.fim ?? ''}
            onChange={(e) => setPeriodo((p) => ({ ...p, fim: e.target.value || undefined }))}
          />
        </div>
        <div className="flex items-end gap-2">
          <button className="btn-secondary" disabled={exportando} onClick={() => exportar('excel')}>
            Excel
          </button>
          <button className="btn-secondary" disabled={exportando} onClick={() => exportar('pdf')}>
            PDF
          </button>
        </div>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <p className="text-gray-500">Carregando…</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
              <tr>
                {def.colunas.map((c) => (
                  <th key={c.key} className="px-4 py-3">{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(!linhas || linhas.length === 0) && (
                <tr>
                  <td colSpan={def.colunas.length} className="px-4 py-8 text-center text-gray-500">
                    Sem dados.
                  </td>
                </tr>
              )}
              {linhas?.map((linha, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                  {def.colunas.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      {c.fmt ? c.fmt(linha[c.key]) : linha[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Resumo({ titulo, valor, cor }: { titulo: string; valor: string; cor?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className={`mt-1 text-xl font-bold ${cor ?? 'text-gray-900 dark:text-white'}`}>{valor}</p>
    </div>
  );
}
