import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, FileText, Pencil, Trash2, Car, DollarSign, User, Camera,
  AlertTriangle, CheckCircle2, X, TrendingUp, ShoppingBag, Receipt,
} from 'lucide-react';
import { deleteVehicle, getVehicle, updateVehicle } from '../../lib/vehicles';
import { getSaleByVehicle } from '../../lib/sales';
import { openContrato } from '../../lib/documents';
import { consultarDebitos } from '../../lib/integrations';
import { DocumentsPanel } from '../../components/DocumentsPanel';
import { getApiError } from '../../lib/api';
import { ConsultaDebitosResult } from '../../types';
import {
  formatData, formatKm, formatMoeda, FORMA_PAGAMENTO_LABEL, SITUACAO_BADGE, SITUACAO_LABEL,
} from '../../lib/format';
import { useAuth } from '../../auth/AuthContext';

export function VehicleDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { temPerfil } = useAuth();
  const [erro, setErro] = useState('');
  const [debitos, setDebitos] = useState<ConsultaDebitosResult | null>(null);
  const [consultandoDebitos, setConsultandoDebitos] = useState(false);

  async function consultarDebitosVeiculo() {
    if (!v) return;
    setErro('');
    setConsultandoDebitos(true);
    try {
      setDebitos(await consultarDebitos(v.placa, v.id));
    } catch (e) {
      setErro(getApiError(e));
    } finally {
      setConsultandoDebitos(false);
    }
  }

  const { data: v, isLoading, isError } = useQuery({
    queryKey: ['veiculo', id],
    queryFn: () => getVehicle(id!),
  });

  const { data: venda } = useQuery({
    queryKey: ['venda', 'veiculo', id],
    queryFn: () => getSaleByVehicle(id!),
    enabled: v?.situacao === 'VENDIDO',
  });

  const podeEditar = temPerfil('ADMIN', 'VENDEDOR');
  const podeExcluir = temPerfil('ADMIN');
  const podeVender = temPerfil('ADMIN', 'VENDEDOR');

  const situacaoMutation = useMutation({
    mutationFn: (situacao: string) => updateVehicle(id!, { situacao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculo', id] });
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
    },
    onError: (e) => setErro(getApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVehicle(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['veiculos'] }),
    onError: (e) => setErro(getApiError(e)),
  });

  function confirmarExclusao() {
    if (window.confirm('Tem certeza que deseja excluir este veiculo? Esta acao nao pode ser desfeita.')) {
      deleteMutation.mutate();
    }
  }

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-40 animate-pulse bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    </div>
  );

  if (isError || !v) return <p className="text-red-600">Veiculo nao encontrado.</p>;

  const lucroEstimado = v.valorVendaSugerido ? v.valorVendaSugerido - v.custoTotal : null;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link to="/veiculos" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400">
        <ChevronLeft size={16} />
        Estoque de Veiculos
      </Link>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <X size={16} className="mt-0.5 shrink-0" />
          {erro}
        </div>
      )}

      {/* HERO — foto + info + resumo financeiro */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col lg:flex-row">
          {/* Foto principal */}
          <div className="relative flex w-full items-center justify-center bg-slate-900 lg:w-64 lg:shrink-0">
            {v.fotos.length > 0 ? (
              <img
                src={v.fotos[0].url}
                alt={`${v.marca} ${v.modelo}`}
                className="h-52 w-full object-cover lg:h-full"
              />
            ) : (
              <div className="flex h-52 w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-700 to-slate-900 text-slate-400 lg:h-full">
                <Car size={48} opacity={0.4} />
                <span className="text-xs">Sem foto</span>
              </div>
            )}
            <span className={`badge absolute left-3 top-3 shadow ${SITUACAO_BADGE[v.situacao]}`}>
              {SITUACAO_LABEL[v.situacao]}
            </span>
          </div>

          {/* Info central */}
          <div className="flex flex-1 flex-col justify-between gap-4 p-5">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {v.marca} {v.modelo}
                  </h1>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {v.anoFabricacao}/{v.anoModelo} &middot; {v.cor} &middot; {v.combustivel} &middot; {formatKm(v.quilometragem)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {podeVender && v.situacao !== 'VENDIDO' && (
                    <Link to={`/veiculos/${v.id}/vender`} className="btn-primary">Registrar Venda</Link>
                  )}
                  {v.situacao === 'VENDIDO' && (
                    <button className="btn-secondary" onClick={() => openContrato(v.id).catch((e) => setErro(getApiError(e)))}>
                      <FileText size={16} />
                      Gerar contrato
                    </button>
                  )}
                  {podeEditar && (
                    <Link to={`/veiculos/${v.id}/editar`} className="btn-secondary">
                      <Pencil size={16} />
                      Editar
                    </Link>
                  )}
                  {podeExcluir && (
                    <button className="btn-danger" onClick={confirmarExclusao} disabled={deleteMutation.isPending}>
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  )}
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                <InfoItem label="Placa" value={v.placa.toUpperCase()} />
                <InfoItem label="Renavam" value={v.renavam} />
                <InfoItem label="Chassi" value={v.chassi.toUpperCase()} />
                <InfoItem label="Entrada" value={formatData(v.dataEntrada)} />
              </dl>
            </div>

            {podeEditar && v.situacao !== 'VENDIDO' && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500">Situacao:</span>
                <button
                  className={`btn-secondary !py-1 text-xs ${v.situacao === 'DISPONIVEL' ? 'ring-1 ring-emerald-400' : ''}`}
                  disabled={v.situacao === 'DISPONIVEL' || situacaoMutation.isPending}
                  onClick={() => situacaoMutation.mutate('DISPONIVEL')}
                >
                  <CheckCircle2 size={13} />
                  Disponivel
                </button>
                <button
                  className={`btn-secondary !py-1 text-xs ${v.situacao === 'RESERVADO' ? 'ring-1 ring-amber-400' : ''}`}
                  disabled={v.situacao === 'RESERVADO' || situacaoMutation.isPending}
                  onClick={() => situacaoMutation.mutate('RESERVADO')}
                >
                  Reservar
                </button>
              </div>
            )}
          </div>

          {/* Resumo financeiro (direita) */}
          <div className="flex w-full shrink-0 flex-col justify-between border-t border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 lg:w-64 lg:border-l lg:border-t-0">
            <div className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Resumo Financeiro</p>
              <ul className="space-y-2 text-sm">
                <FinanceRow label="Valor de compra" value={formatMoeda(v.valorCompra)} />
                <FinanceRow label="Custos adicionais" value={formatMoeda(v.custoTotal - v.valorCompra)} />
                <FinanceRow label="Custo total" value={formatMoeda(v.custoTotal)} bold />
                {v.valorVendaSugerido ? (
                  <FinanceRow label="Preco de venda" value={formatMoeda(v.valorVendaSugerido)} />
                ) : null}
                {lucroEstimado !== null ? (
                  <FinanceRow
                    label="Lucro estimado"
                    value={formatMoeda(lucroEstimado)}
                    highlight={lucroEstimado >= 0 ? 'green' : 'red'}
                    bold
                  />
                ) : null}
              </ul>
            </div>
            {v.situacao === 'VENDIDO' && venda && (
              <div className="border-t border-slate-200 bg-emerald-50 p-4 dark:border-slate-700 dark:bg-emerald-900/20">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Vendido</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatMoeda(venda.valorTotal)}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Lucro: <span className="font-semibold">{formatMoeda(venda.lucroBruto)}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Venda registrada detalhada */}
      {v.situacao === 'VENDIDO' && venda && (
        <section className="card border-l-4 border-l-emerald-500">
          <div className="section-title">
            <CheckCircle2 size={18} className="text-emerald-500" />
            Venda registrada
          </div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
            <InfoItem label="Data" value={formatData(venda.dataVenda)} />
            <InfoItem label="Comprador" value={venda.comprador?.nome ?? '-'} />
            <InfoItem label="Vendedor" value={venda.vendedor?.nome ?? '-'} />
            <InfoItem label="Pagamento" value={FORMA_PAGAMENTO_LABEL[venda.formaPagamento]} />
            <InfoItem label="Valor da venda" value={formatMoeda(venda.valorTotal)} />
            <InfoItem label="Custo total" value={formatMoeda(venda.custoTotalSnapshot)} />
            <InfoItem label="Lucro bruto" value={formatMoeda(venda.lucroBruto)} />
          </dl>
          {venda.observacoes && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">Obs:</span> {venda.observacoes}
            </p>
          )}
        </section>
      )}

      {/* Grid de secoes */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Custos detalhados */}
        {v.custos.length > 0 && (
          <section className="card">
            <div className="section-title">
              <Receipt size={18} className="text-brand-500" />
              Custos adicionais
            </div>
            <ul className="space-y-1 text-sm">
              {v.custos.map((c) => (
                <li key={c.id} className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300">
                    {c.descricao}
                    {c.categoria ? <span className="ml-1 text-xs text-slate-400">({c.categoria})</span> : ''}
                  </span>
                  <span className="font-medium">{formatMoeda(c.valor)}</span>
                </li>
              ))}
              <li className="flex justify-between pt-2 text-sm font-semibold text-slate-900 dark:text-white">
                <span>Total</span>
                <span>{formatMoeda(v.custoTotal - v.valorCompra)}</span>
              </li>
            </ul>
          </section>
        )}

        {/* Antigo proprietario */}
        <section className="card">
          <div className="section-title">
            <User size={18} className="text-brand-500" />
            Antigo proprietario
          </div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <InfoItem label="Nome" value={v.propNome} />
            <InfoItem label="CPF/CNPJ" value={v.propCpfCnpj} />
            <InfoItem label="Telefone" value={v.propTelefone ?? '-'} />
            <InfoItem label="Endereco" value={v.propEndereco ?? '-'} />
          </dl>
        </section>

        {/* Fotos */}
        {v.fotos.length > 1 && (
          <section className="card lg:col-span-2">
            <div className="section-title">
              <Camera size={18} className="text-brand-500" />
              Fotos ({v.fotos.length})
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {v.fotos.map((f) => (
                <img key={f.id} src={f.url} alt={f.legenda ?? ''} className="h-24 w-full rounded-lg object-cover" />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* DETRAN */}
      <section className="card">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Debitos e restricoes (DETRAN)</h2>
          </div>
          <button className="btn-secondary" onClick={consultarDebitosVeiculo} disabled={consultandoDebitos}>
            {consultandoDebitos ? 'Consultando...' : 'Consultar'}
          </button>
        </div>

        {!debitos && (
          <p className="text-sm text-slate-500">Clique em "Consultar" para verificar IPVA, multas e restricoes.</p>
        )}

        {debitos && (
          <div className="space-y-3 text-sm">
            {debitos.simulado && (
              <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <AlertTriangle size={14} />
                Dados simulados{debitos.aviso ? ` — ${debitos.aviso}` : '.'}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox label={`IPVA ${debitos.ipva.ano}`} value={debitos.ipva.pago ? 'Pago' : formatMoeda(debitos.ipva.valor)} ok={debitos.ipva.pago} />
              <StatBox label={`Licenc. ${debitos.licenciamento.ano}`} value={`${formatMoeda(debitos.licenciamento.valor)}`} sub={debitos.licenciamento.situacao} />
              <StatBox label="Multas" value={String(debitos.multas.length)} ok={debitos.multas.length === 0} />
              <StatBox label="Total debitos" value={formatMoeda(debitos.totalDebitos)} ok={debitos.totalDebitos === 0} bold />
            </div>

            {debitos.multas.length > 0 && (
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Multas</h3>
                <ul className="space-y-1">
                  {debitos.multas.map((m, i) => (
                    <li key={i} className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-700">
                      <span>{m.descricao}{m.data ? ` - ${formatData(m.data)}` : ''}</span>
                      <span>{formatMoeda(m.valor)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {debitos.restricoes.length > 0 && (
              <p className="flex items-center gap-2 font-medium text-red-600">
                <X size={14} />
                Restricoes: {debitos.restricoes.join(', ')}
              </p>
            )}

            <p className="text-xs text-slate-400">
              Consultado em {formatData(debitos.consultadoEm)} - fonte: {debitos.fonte}
            </p>
          </div>
        )}
      </section>

      <DocumentsPanel veiculoId={v.id} />
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

function FinanceRow({
  label, value, bold, highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: 'green' | 'red';
}) {
  const color = highlight === 'green'
    ? 'text-emerald-600 dark:text-emerald-400'
    : highlight === 'red'
    ? 'text-red-600 dark:text-red-400'
    : 'text-slate-800 dark:text-slate-200';
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${color}`}>{value}</span>
    </li>
  );
}

function StatBox({ label, value, sub, ok, bold }: { label: string; value: string; sub?: string; ok?: boolean; bold?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${ok === true ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20' : ok === false ? 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/30'}`}>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-0.5 ${bold ? 'text-base font-bold' : 'text-sm font-semibold'} ${ok === false ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
