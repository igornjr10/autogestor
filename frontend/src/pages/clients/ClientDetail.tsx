import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Pencil, Trash2, Phone, Mail, MapPin, X, ShoppingBag, TrendingUp } from 'lucide-react';
import { deleteClient, getClient } from '../../lib/clients';
import { DocumentsPanel } from '../../components/DocumentsPanel';
import { getApiError } from '../../lib/api';
import { formatData, formatMoeda, FORMA_PAGAMENTO_LABEL, TIPO_CLIENTE_LABEL } from '../../lib/format';
import { useAuth } from '../../auth/AuthContext';

export function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { temPerfil } = useAuth();
  const [erro, setErro] = useState('');

  const { data: c, isLoading, isError } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => getClient(id!),
  });

  const podeEditar = temPerfil('ADMIN', 'VENDEDOR');
  const podeExcluir = temPerfil('ADMIN');

  const deleteMutation = useMutation({
    mutationFn: () => deleteClient(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      navigate('/clientes');
    },
    onError: (e) => setErro(getApiError(e)),
  });

  function confirmarExclusao() {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) deleteMutation.mutate();
  }

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-52 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
    </div>
  );
  if (isError || !c) return <p className="text-red-600">Cliente nao encontrado.</p>;

  const initials = c.nome?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'C';
  const totalGasto = c.compras.reduce((sum: number, cp: { valorTotal: number }) => sum + cp.valorTotal, 0);
  const tipoColors: Record<string, string> = {
    COMPRADOR: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
    VENDEDOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    AMBOS: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link to="/clientes" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
        <ChevronLeft size={16} />
        Clientes
      </Link>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <X size={16} className="mt-0.5 shrink-0" />
          {erro}
        </div>
      )}

      {/* HERO */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col lg:flex-row">
          {/* Avatar */}
          <div className="flex w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 py-10 lg:w-52 lg:shrink-0 lg:py-0">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-4xl font-bold text-white shadow-inner">
              {initials}
            </div>
          </div>

          {/* Info central */}
          <div className="flex flex-1 flex-col justify-between gap-4 p-5">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{c.nome}</h1>
                  <span className={`badge mt-1 inline-block ${tipoColors[c.tipo] ?? ''}`}>
                    {TIPO_CLIENTE_LABEL[c.tipo]}
                  </span>
                </div>
                <div className="flex gap-2">
                  {podeEditar && (
                    <Link to={`/clientes/${c.id}/editar`} className="btn-secondary">
                      <Pencil size={16} /> Editar
                    </Link>
                  )}
                  {podeExcluir && (
                    <button className="btn-danger" onClick={confirmarExclusao} disabled={deleteMutation.isPending}>
                      <Trash2 size={16} /> Excluir
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                {c.telefone && (
                  <span className="flex items-center gap-1">
                    <Phone size={14} className="text-slate-400" />
                    {c.telefone}
                  </span>
                )}
                {c.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={14} className="text-slate-400" />
                    {c.email}
                  </span>
                )}
                {c.endereco && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-slate-400" />
                    {c.endereco}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Resumo compras */}
          <div className="flex w-full shrink-0 flex-col justify-center border-t border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/50 lg:w-56 lg:border-l lg:border-t-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Historico</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-100 p-2 dark:bg-brand-900/30">
                  <ShoppingBag size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Compras realizadas</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{c.compras.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                  <TrendingUp size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total gasto</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatMoeda(totalGasto)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Dados cadastrais */}
        <section className="card">
          <div className="section-title">
            <span className="h-3 w-3 rounded-full bg-brand-500" />
            Dados cadastrais
          </div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <InfoItem label="CPF / CNPJ" value={c.cpfCnpj} />
            <InfoItem label="RG" value={c.rg ?? '-'} />
            <InfoItem label="CNH" value={c.cnh ?? '-'} />
            <InfoItem label="Nascimento" value={formatData(c.dataNascimento)} />
          </dl>
          {c.observacoes && (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
              {c.observacoes}
            </p>
          )}
        </section>

        {/* Historico de compras */}
        <section className="card">
          <div className="section-title">
            <ShoppingBag size={16} className="text-brand-500" />
            Historico de compras ({c.compras.length})
          </div>
          {c.compras.length === 0 ? (
            <p className="rounded-lg bg-slate-50 py-8 text-center text-sm text-slate-500 dark:bg-slate-700/30">
              Nenhuma compra registrada.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {c.compras.map((compra: { id: string; veiculo: { id: string; marca: string; modelo: string }; dataVenda: string; formaPagamento: string; vendedor: { nome: string }; valorTotal: number }) => (
                <li key={compra.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-700">
                  <div>
                    <Link to={`/veiculos/${compra.veiculo.id}`} className="font-semibold text-slate-900 hover:text-brand-600 dark:text-slate-100">
                      {compra.veiculo.marca} {compra.veiculo.modelo}
                    </Link>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {formatData(compra.dataVenda)} &middot; {FORMA_PAGAMENTO_LABEL[compra.formaPagamento]} &middot; {compra.vendedor.nome}
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 font-bold text-emerald-600">{formatMoeda(compra.valorTotal)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <DocumentsPanel clienteId={c.id} />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800 dark:text-slate-200">{value}</dd>
    </>
  );
}
