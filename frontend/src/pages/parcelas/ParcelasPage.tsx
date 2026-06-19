import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, AlertTriangle, Trash2, X, DollarSign, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import { deleteParcela, listParcelas, marcarPago, getParcelasResumo, StatusParcela } from '../../lib/parcelas';
import { getApiError } from '../../lib/api';
import { formatData, formatMoeda } from '../../lib/format';

const STATUS_CONFIG: Record<StatusParcela, { label: string; cls: string; icon: React.ElementType }> = {
  PENDENTE: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: Clock },
  PAGO: { label: 'Pago', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle },
  ATRASADO: { label: 'Atrasado', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', icon: AlertTriangle },
};

export function ParcelasPage() {
  const queryClient = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState<StatusParcela | ''>('');
  const [erro, setErro] = useState('');

  const { data: parcelas, isLoading } = useQuery({
    queryKey: ['parcelas', filtroStatus],
    queryFn: () => listParcelas(filtroStatus ? { status: filtroStatus as StatusParcela } : undefined),
  });

  const { data: resumo } = useQuery({
    queryKey: ['parcelas-resumo'],
    queryFn: getParcelasResumo,
  });

  const pagarMutation = useMutation({
    mutationFn: (id: string) => marcarPago(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['parcelas-resumo'] });
    },
    onError: (e) => setErro(getApiError(e)),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => deleteParcela(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['parcelas-resumo'] });
    },
    onError: (e) => setErro(getApiError(e)),
  });

  function confirmarExclusao(id: string) {
    if (window.confirm('Excluir esta parcela?')) excluirMutation.mutate(id);
  }

  const getResumoVal = (status: StatusParcela) => {
    const item = resumo?.find((r) => r.status === status);
    return { count: item?._count?.id ?? 0, total: item?._sum?.valor ?? 0 };
  };

  const pendente = getResumoVal('PENDENTE');
  const atrasado = getResumoVal('ATRASADO');
  const pago = getResumoVal('PAGO');

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parcelas e Pagamentos</h1>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <X size={16} className="mt-0.5 shrink-0" />
          {erro}
          <button className="ml-auto" onClick={() => setErro('')}><X size={14} /></button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="kpi-card-rose">
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white/80">Em atraso</p>
              <p className="mt-1 text-3xl font-bold text-white">{atrasado.count}</p>
              <p className="mt-0.5 text-xs text-white/60">{formatMoeda(atrasado.total)}</p>
            </div>
            <div className="rounded-lg bg-white/20 p-2"><AlertTriangle size={22} className="text-white" /></div>
          </div>
        </div>

        <div className="kpi-card-amber">
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white/80">Pendentes</p>
              <p className="mt-1 text-3xl font-bold text-white">{pendente.count}</p>
              <p className="mt-0.5 text-xs text-white/60">{formatMoeda(pendente.total)}</p>
            </div>
            <div className="rounded-lg bg-white/20 p-2"><TrendingDown size={22} className="text-white" /></div>
          </div>
        </div>

        <div className="kpi-card-emerald">
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white/80">Recebidas</p>
              <p className="mt-1 text-3xl font-bold text-white">{pago.count}</p>
              <p className="mt-0.5 text-xs text-white/60">{formatMoeda(pago.total)}</p>
            </div>
            <div className="rounded-lg bg-white/20 p-2"><TrendingUp size={22} className="text-white" /></div>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {(['', 'ATRASADO', 'PENDENTE', 'PAGO'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filtroStatus === s
                ? 'bg-brand-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {s === '' ? 'Todas' : STATUS_CONFIG[s as StatusParcela].label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />)}
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Parcela</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Veiculo</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {!parcelas?.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <DollarSign size={32} className="mx-auto mb-2 text-slate-300" />
                    Nenhuma parcela encontrada.
                  </td>
                </tr>
              )}
              {parcelas?.map((p) => {
                const s = STATUS_CONFIG[p.status];
                const SIcon = s.icon;
                const vencida = p.status === 'ATRASADO' || (p.status === 'PENDENTE' && new Date(p.vencimento) < new Date());
                return (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                      #{p.numero}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{p.venda.comprador.nome}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.venda.veiculo.marca} {p.venda.veiculo.modelo}
                      <span className="ml-1 text-xs text-slate-400">({p.venda.veiculo.placa})</span>
                    </td>
                    <td className={`px-4 py-3 ${vencida ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {formatData(p.vencimento)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-100">
                      {formatMoeda(p.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge flex w-fit items-center gap-1 ${s.cls}`}>
                        <SIcon size={11} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {p.status !== 'PAGO' && (
                          <button
                            className="rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                            onClick={() => pagarMutation.mutate(p.id)}
                            disabled={pagarMutation.isPending}
                            title="Marcar como pago"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        <button
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
                          onClick={() => confirmarExclusao(p.id)}
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
