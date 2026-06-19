import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X, TrendingUp, TrendingDown, Wallet, Trash2 } from 'lucide-react';
import {
  CashFilters, createLancamento, deleteLancamento, getCategorias, getResumo, listLancamentos,
} from '../../lib/cashflow';
import { getApiError } from '../../lib/api';
import { formatData, formatMoeda } from '../../lib/format';
import { useFilial } from '../../auth/FilialContext';

const schema = z.object({
  tipo: z.enum(['ENTRADA', 'SAIDA']),
  valor: z.coerce.number().positive('Valor deve ser positivo.'),
  data: z.string().min(1, 'Informe a data.'),
  categoria: z.string().min(2, 'Selecione a categoria.'),
  descricao: z.string().optional(),
  formaPagamento: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CashflowPage() {
  const queryClient = useQueryClient();
  const { isGlobal, filialAtiva } = useFilial();
  const [filters, setFilters] = useState<CashFilters>({});
  const [erro, setErro] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const filtrosComFilial = { ...filters, filialId: filialAtiva };

  const { data: lancamentos, isLoading } = useQuery({
    queryKey: ['lancamentos', filtrosComFilial],
    queryFn: () => listLancamentos(filtrosComFilial),
  });
  const { data: resumo } = useQuery({
    queryKey: ['caixa-resumo', filtrosComFilial],
    queryFn: () => getResumo(filtrosComFilial),
  });
  const { data: categorias } = useQuery({ queryKey: ['caixa-categorias'], queryFn: getCategorias });

  const {
    register, handleSubmit, watch, reset, formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { tipo: 'ENTRADA' },
  });

  const tipo = watch('tipo');
  const opcoesCategoria = categorias ? categorias[tipo] : [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteLancamento(id),
    onSuccess: () => invalidar(),
    onError: (e) => setErro(getApiError(e)),
  });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    queryClient.invalidateQueries({ queryKey: ['caixa-resumo'] });
  }

  async function onSubmit(data: FormData) {
    setErro('');
    try {
      await createLancamento({
        ...data,
        data: new Date(data.data).toISOString(),
        descricao: data.descricao || undefined,
        formaPagamento: data.formaPagamento || undefined,
        filialId: filialAtiva,
      });
      reset({ tipo: data.tipo });
      setMostrarForm(false);
      invalidar();
    } catch (e) {
      setErro(getApiError(e));
    }
  }

  function confirmarExclusao(id: string) {
    if (window.confirm('Excluir este lancamento?')) removeMutation.mutate(id);
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Controle de Caixa</h1>
        <button className="btn-primary" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? <><X size={16} /> Fechar</> : <><Plus size={16} /> Novo lancamento</>}
        </button>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <X size={16} className="mt-0.5 shrink-0" />
          {erro}
        </div>
      )}

      {/* Cards coloridos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="kpi-card-emerald">
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white/80">Entradas</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {resumo?.totalEntradas != null ? formatMoeda(resumo.totalEntradas) : '-'}
              </p>
            </div>
            <div className="rounded-lg bg-white/20 p-2">
              <TrendingUp size={22} className="text-white" />
            </div>
          </div>
        </div>

        <div className="kpi-card-rose">
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white/80">Saidas</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {resumo?.totalSaidas != null ? formatMoeda(resumo.totalSaidas) : '-'}
              </p>
            </div>
            <div className="rounded-lg bg-white/20 p-2">
              <TrendingDown size={22} className="text-white" />
            </div>
          </div>
        </div>

        <div className={`kpi-card ${(resumo?.saldo ?? 0) >= 0 ? 'bg-gradient-to-br from-brand-500 to-brand-700' : 'bg-gradient-to-br from-rose-600 to-rose-800'}`}>
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white/80">Saldo do periodo</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {resumo?.saldo != null ? formatMoeda(resumo.saldo) : '-'}
              </p>
            </div>
            <div className="rounded-lg bg-white/20 p-2">
              <Wallet size={22} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Aviso filial */}
      {isGlobal && !filialAtiva && mostrarForm && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Selecione uma filial no seletor do topo para registrar lancamentos.
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="card">
          <p className="section-title">
            <Plus size={16} className="text-brand-500" />
            Novo lancamento
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Tipo</label>
              <select className="input" {...register('tipo')}>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saida</option>
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input" {...register('categoria')}>
                <option value="">Selecione...</option>
                {opcoesCategoria.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.categoria && <p className="field-error">{errors.categoria.message}</p>}
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input className="input" type="number" step="0.01" {...register('valor')} />
              {errors.valor && <p className="field-error">{errors.valor.message}</p>}
            </div>
            <div>
              <label className="label">Data</label>
              <input className="input" type="date" {...register('data')} />
              {errors.data && <p className="field-error">{errors.data.message}</p>}
            </div>
            <div>
              <label className="label">Forma de pagamento</label>
              <input className="input" placeholder="Dinheiro, PIX..." {...register('formaPagamento')} />
            </div>
            <div>
              <label className="label">Descricao</label>
              <input className="input" {...register('descricao')} />
            </div>
          </div>
          <div className="mt-4 flex gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Lancar'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMostrarForm(false)}>
              <X size={16} /> Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Filtros de periodo */}
      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="label">De</label>
          <input className="input" type="date" value={filters.inicio ?? ''} onChange={(e) => setFilters((f) => ({ ...f, inicio: e.target.value || undefined }))} />
        </div>
        <div>
          <label className="label">Ate</label>
          <input className="input" type="date" value={filters.fim ?? ''} onChange={(e) => setFilters((f) => ({ ...f, fim: e.target.value || undefined }))} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={filters.tipo ?? ''} onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value || undefined }))}>
            <option value="">Todos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SAIDA">Saidas</option>
          </select>
        </div>
      </div>

      {/* Extrato */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="card h-12 animate-pulse bg-slate-200 dark:bg-slate-700" />)}
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Descricao</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {lancamentos?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Nenhum lancamento no periodo.
                  </td>
                </tr>
              )}
              {lancamentos?.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 text-slate-500">{formatData(l.data)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${l.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
                      {l.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{l.descricao ?? '-'}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${l.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {l.tipo === 'ENTRADA' ? '+' : '-'} {formatMoeda(l.valor)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
                      onClick={() => confirmarExclusao(l.id)}
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
