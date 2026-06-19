import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Car, ShoppingCart, TrendingUp, Wallet, Banknote, FileWarning, LucideIcon } from 'lucide-react';
import { getDashboard } from '../../lib/dashboard';
import { formatMoeda } from '../../lib/format';
import { useFilial } from '../../auth/FilialContext';

const CORES_SITUACAO: Record<string, string> = {
  DISPONIVEL: '#22c55e',
  RESERVADO: '#eab308',
  VENDIDO: '#6b7280',
};

const LABEL_SITUACAO: Record<string, string> = {
  DISPONIVEL: 'Disponivel',
  RESERVADO: 'Reservado',
  VENDIDO: 'Vendido',
};

export function Dashboard() {
  const { filialAtiva } = useFilial();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', filialAtiva],
    queryFn: () => getDashboard(filialAtiva),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    </div>
  );
  if (isError || !data) return <p className="text-red-600">Erro ao carregar o dashboard.</p>;

  const { cards } = data;
  const pieData = Object.entries(data.distribuicaoSituacao).map(([k, v]) => ({
    name: LABEL_SITUACAO[k] ?? k,
    key: k,
    value: v,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>

      {/* KPI Cards coloridos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          variant="kpi-card-indigo"
          icon={Car}
          titulo="Veiculos em estoque"
          valor={String(cards.veiculosEmEstoque)}
        />
        <KpiCard
          variant="kpi-card-violet"
          icon={ShoppingCart}
          titulo="Vendidos no mes"
          valor={String(cards.vendidosNoMes)}
        />
        <KpiCard
          variant="kpi-card-blue"
          icon={TrendingUp}
          titulo="Faturamento do mes"
          valor={formatMoeda(cards.faturamentoMes)}
          grande
        />
        <KpiCard
          variant="kpi-card-emerald"
          icon={Banknote}
          titulo="Lucro bruto do mes"
          valor={formatMoeda(cards.lucroBrutoMes)}
          grande
        />
        <KpiCard
          variant="kpi-card-amber"
          icon={Wallet}
          titulo="Saldo em caixa"
          valor={formatMoeda(cards.saldoCaixa)}
          grande
        />
        <KpiCard
          variant="kpi-card-rose"
          icon={FileWarning}
          titulo="Documentacao pendente"
          valor={String(cards.documentacaoPendente)}
          legenda="veiculos com docs. em aberto"
        />
      </div>

      {/* Graficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <p className="section-title">
            <span className="h-3 w-3 rounded-full bg-brand-500" />
            Vendas por mes (12 meses)
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.vendasPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" fontSize={11} tick={{ fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} fontSize={11} tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="qtd" name="Qtd. vendas" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="section-title">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            Faturamento x Custo x Lucro
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.vendasPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" fontSize={11} tick={{ fill: '#94a3b8' }} />
              <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatMoeda(v)} contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="custo" name="Custo" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="section-title">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            Distribuicao por situacao
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={CORES_SITUACAO[entry.key] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="section-title">
            <span className="h-3 w-3 rounded-full bg-violet-500" />
            Ranking de vendedores (mes)
          </p>
          {data.rankingVendedores.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Nenhuma venda neste mes.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.rankingVendedores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" fontSize={11} tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" width={100} fontSize={11} tick={{ fill: '#94a3b8' }} />
                <Tooltip formatter={(v: number) => formatMoeda(v)} contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="faturamento" name="Faturamento" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  variant,
  icon: Icon,
  titulo,
  valor,
  grande,
  legenda,
}: {
  variant: string;
  icon: LucideIcon;
  titulo: string;
  valor: string;
  grande?: boolean;
  legenda?: string;
}) {
  return (
    <div className={variant}>
      {/* decoracao de fundo */}
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-6 -right-2 h-28 w-28 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-white/80">{titulo}</p>
          <p className={`mt-1 font-bold text-white ${grande ? 'text-2xl' : 'text-3xl'}`}>{valor}</p>
          {legenda && <p className="mt-0.5 text-xs text-white/60">{legenda}</p>}
        </div>
        <div className="rounded-lg bg-white/20 p-2">
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}
