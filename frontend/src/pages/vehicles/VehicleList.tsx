import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Car, Tag, ShieldCheck, DollarSign, LayoutGrid, TableProperties, SlidersHorizontal, X, Fuel, Gauge, Heart } from 'lucide-react';
import { listVehicles, VehicleFilters } from '../../lib/vehicles';
import { formatMoeda, formatData, SITUACAO_BADGE, SITUACAO_LABEL } from '../../lib/format';
import { useAuth } from '../../auth/AuthContext';
import { useFilial } from '../../auth/FilialContext';
import { Veiculo } from '../../types';

/* ── mini sparkline ── */
function Spark({ points, color }: { points: number[]; color: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 80; const h = 32;
  const step = w / (points.length - 1);
  const coords = points.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={coords} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SPARK_BLUE   = [20, 35, 28, 50, 40, 65, 55, 70, 60, 80];
const SPARK_GREEN  = [40, 30, 50, 45, 60, 55, 70, 65, 75, 72];
const SPARK_ORANGE = [10, 25, 20, 40, 35, 55, 48, 62, 58, 75];

/* ── badge de situação ── */
const SITUACAO_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  DISPONIVEL: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', dot: '#22c55e' },
  RESERVADO:  { bg: 'rgba(234,179,8,0.15)',  text: '#facc15', dot: '#eab308' },
  VENDIDO:    { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', dot: '#64748b' },
};

/* ── combustível label ── */
const COMB_LABEL: Record<string, string> = {
  FLEX: 'Flex', GASOLINA: 'Gasolina', DIESEL: 'Diesel', ELETRICO: 'Elétrico', HIBRIDO: 'Híbrido',
};

/* ── card individual de veículo ── */
function VehicleCard({ v, podeCadastrar }: { v: Veiculo; podeCadastrar: boolean }) {
  const foto = v.fotos?.[0]?.url;
  const s = SITUACAO_STYLE[v.situacao] ?? SITUACAO_STYLE.DISPONIVEL;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40"
      style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Imagem */}
      <div className="relative h-44 overflow-hidden" style={{ background: '#0d1117' }}>
        {foto ? (
          <img src={foto} alt={`${v.marca} ${v.modelo}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Car size={48} className="text-slate-700" />
          </div>
        )}
        {/* Badge situação */}
        <span
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: s.bg, color: s.text }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
          {SITUACAO_LABEL[v.situacao]}
        </span>
        {/* Heart */}
        <button className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:text-rose-400"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <Heart size={14} />
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1.5 font-semibold text-slate-100">{v.marca} {v.modelo}</h3>

        {/* Placa + Ano */}
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
            style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
            {v.placa}
          </span>
          <span className="text-xs text-slate-500">{v.anoFabricacao}/{v.anoModelo}</span>
        </div>

        {/* Specs */}
        <div className="mb-4 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Fuel size={11} /> {COMB_LABEL[v.combustivel] ?? v.combustivel}
          </span>
          <span className="flex items-center gap-1">
            <Gauge size={11} /> {v.quilometragem?.toLocaleString('pt-BR')} km
          </span>
        </div>

        {/* Preços */}
        <div className="mb-4 flex gap-4 text-xs">
          <div>
            <p className="text-slate-500">Compra</p>
            <p className="font-semibold text-slate-300">{formatMoeda(v.valorCompra)}</p>
          </div>
          <div>
            <p className="text-slate-500">Venda</p>
            <p className="font-semibold text-green-400">{v.valorVendaSugerido ? formatMoeda(v.valorVendaSugerido) : '—'}</p>
          </div>
        </div>

        {/* Botões */}
        <div className="mt-auto flex gap-2">
          {podeCadastrar && (
            <Link to={`/veiculos/${v.id}/editar`}
              className="flex-1 rounded-xl py-2 text-center text-xs font-medium text-slate-300 transition-colors hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Editar
            </Link>
          )}
          <Link to={`/veiculos/${v.id}`}
            className="flex-1 rounded-xl py-2 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)' }}
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── página principal ── */
export function VehicleList() {
  const { temPerfil } = useAuth();
  const { filialAtiva } = useFilial();
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const { data, isLoading } = useQuery({
    queryKey: ['veiculos', { ...filters, filialId: filialAtiva }],
    queryFn: () => listVehicles({ ...filters, filialId: filialAtiva }),
  });

  const podeCadastrar = temPerfil('ADMIN', 'VENDEDOR');

  const total       = data?.length ?? 0;
  const vendidos    = data?.filter(v => v.situacao === 'VENDIDO').length ?? 0;
  const disponiveis = data?.filter(v => v.situacao === 'DISPONIVEL').length ?? 0;
  const faturamento = data?.filter(v => v.situacao === 'VENDIDO')
    .reduce((s, v) => s + (v.valorVendaSugerido ?? v.custoTotal), 0) ?? 0;

  const kpis = [
    { label: 'Total de Veículos', value: total,       sub: '100% do estoque',          icon: Car,        iconBg: 'rgba(99,102,241,0.2)',  iconColor: '#818cf8', spark: SPARK_BLUE,   sparkColor: '#4f6ef7' },
    { label: 'Vendidos',          value: vendidos,     sub: 'No estoque',               icon: Tag,        iconBg: 'rgba(59,130,246,0.2)',  iconColor: '#60a5fa', spark: SPARK_BLUE,   sparkColor: '#3b82f6' },
    { label: 'Disponíveis',       value: disponiveis,  sub: `${total ? Math.round(disponiveis/total*100) : 0}% do total`, icon: ShieldCheck, iconBg: 'rgba(34,197,94,0.2)', iconColor: '#4ade80', spark: SPARK_GREEN,  sparkColor: '#22c55e' },
    { label: 'Faturamento (mês)', value: formatMoeda(faturamento), sub: 'Veículos vendidos', icon: DollarSign, iconBg: 'rgba(234,179,8,0.2)',  iconColor: '#facc15', spark: SPARK_ORANGE, sparkColor: '#f59e0b' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Car size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Estoque de Veículos</h1>
            <p className="text-xs text-slate-500">Gerencie todo o estoque da sua loja</p>
          </div>
        </div>
        {podeCadastrar && (
          <Link to="/veiculos/novo"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
          >
            <Plus size={16} /> Novo veículo
          </Link>
        )}
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="flex items-center justify-between rounded-2xl p-4"
            style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: k.iconBg }}>
                <k.icon size={18} style={{ color: k.iconColor }} />
              </div>
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className="mt-0.5 text-xl font-bold text-slate-100">{k.value}</p>
              <p className="text-[11px] text-slate-500">{k.sub}</p>
            </div>
            <Spark points={k.spark} color={k.sparkColor} />
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl p-4"
        style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Busca */}
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs text-slate-400">Buscar veículo</label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full rounded-xl py-2 pl-8 pr-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              placeholder="Ex: Civic, ABC1D23..."
              value={filters.busca ?? ''}
              onChange={e => setFilters(f => ({ ...f, busca: e.target.value || undefined }))}
            />
          </div>
        </div>

        {/* Marca */}
        <div className="w-40">
          <label className="mb-1 block text-xs text-slate-400">Marca</label>
          <input
            className="w-full rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500/50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            placeholder="Todas as marcas"
            value={filters.marca ?? ''}
            onChange={e => setFilters(f => ({ ...f, marca: e.target.value || undefined }))}
          />
        </div>

        {/* Situação */}
        <div className="w-36">
          <label className="mb-1 block text-xs text-slate-400">Situação</label>
          <select
            className="w-full rounded-xl py-2 px-3 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500/50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            value={filters.situacao ?? ''}
            onChange={e => setFilters(f => ({ ...f, situacao: e.target.value || undefined }))}
          >
            <option value="">Todas</option>
            <option value="DISPONIVEL">Disponível</option>
            <option value="RESERVADO">Reservado</option>
            <option value="VENDIDO">Vendido</option>
          </select>
        </div>

        {/* Limpar */}
        {(filters.busca || filters.marca || filters.situacao) && (
          <button
            onClick={() => setFilters({})}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-slate-400 transition-colors hover:text-slate-200"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <X size={13} /> Limpar filtros
          </button>
        )}
      </div>

      {/* Barra de resultados + toggle */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-slate-200">{total}</span> veículos encontrados
        </p>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setView('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${view === 'cards' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutGrid size={13} /> Cards
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${view === 'table' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <TableProperties size={13} /> Tabela
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl" style={{ background: '#1a2235' }} />
          ))}
        </div>
      )}

      {/* Cards */}
      {!isLoading && data && view === 'cards' && (
        <>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
              <Car size={48} className="opacity-20" />
              <p>Nenhum veículo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.map(v => <VehicleCard key={v.id} v={v} podeCadastrar={podeCadastrar} />)}
            </div>
          )}
        </>
      )}

      {/* Tabela */}
      {!isLoading && data && view === 'table' && (
        <div className="overflow-hidden rounded-2xl" style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Veículo', 'Placa', 'Ano', 'Km', 'Compra', 'Venda', 'Situação', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-slate-500">Nenhum veículo encontrado.</td></tr>
              )}
              {data.map(v => {
                const s = SITUACAO_STYLE[v.situacao] ?? SITUACAO_STYLE.DISPONIVEL;
                return (
                  <tr key={v.id} className="transition-colors hover:bg-white/[0.03]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3">
                      <Link to={`/veiculos/${v.id}`} className="font-medium text-slate-200 hover:text-indigo-300">
                        {v.marca} {v.modelo}
                      </Link>
                      <div className="text-xs text-slate-500">{v.cor}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded px-1.5 py-0.5 text-xs font-bold uppercase" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>{v.placa}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{v.anoFabricacao}/{v.anoModelo}</td>
                    <td className="px-4 py-3 text-slate-400">{v.quilometragem?.toLocaleString('pt-BR')} km</td>
                    <td className="px-4 py-3 text-slate-300">{formatMoeda(v.valorCompra)}</td>
                    <td className="px-4 py-3 font-medium text-green-400">{v.valorVendaSugerido ? formatMoeda(v.valorVendaSugerido) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: s.bg, color: s.text }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
                        {SITUACAO_LABEL[v.situacao]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/veiculos/${v.id}`} className="text-xs text-indigo-400 hover:text-indigo-300">Ver detalhes →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
