import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, RefreshCw, CheckCircle, XCircle, Clock, Wifi, WifiOff, Package, Phone, X, FileWarning, DollarSign } from 'lucide-react';
import {
  enviarTeste, getStatus, listarNotificacoes, verificarEstoque, verificarDocumentos, verificarParcelas,
} from '../../lib/notifications';
import { getApiError } from '../../lib/api';
import { formatData } from '../../lib/format';

const STATUS_CONFIG = {
  ENVIADA: { label: 'Enviada', icon: CheckCircle, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  FALHOU: { label: 'Falhou', icon: XCircle, cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  SIMULADA: { label: 'Simulada', icon: Clock, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

const TIPO_LABEL: Record<string, string> = {
  ATPV: 'ATPV (Transferencia)',
  ESTOQUE_60_DIAS: 'Estoque 60 dias',
  DOC_PENDENTE: 'Doc. pendente',
  TESTE: 'Teste',
};

export function NotificacoesPage() {
  const queryClient = useQueryClient();
  const [telefone, setTelefone] = useState('');
  const [feedback, setFeedback] = useState('');
  const [erro, setErro] = useState('');

  const { data: status, isLoading: loadingStatus } = useQuery({
    queryKey: ['notificacoes-status'],
    queryFn: getStatus,
  });

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: listarNotificacoes,
    refetchInterval: 15000,
  });

  const testeMutation = useMutation({
    mutationFn: () => enviarTeste(telefone),
    onSuccess: (n) => {
      setFeedback(n.status === 'ENVIADA' ? 'Mensagem enviada com sucesso!' : n.status === 'SIMULADA' ? 'Simulado (sem token configurado).' : 'Falhou ao enviar.');
      setErro('');
      setTelefone('');
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
    onError: (e) => { setErro(getApiError(e)); setFeedback(''); },
  });

  const estoqueMutation = useMutation({
    mutationFn: verificarEstoque,
    onSuccess: (r) => {
      setFeedback(`Verificacao concluida: ${r.veiculosAlertados} veiculo(s) alertado(s).`);
      setErro('');
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
    onError: (e) => { setErro(getApiError(e)); setFeedback(''); },
  });

  const docsMutation = useMutation({
    mutationFn: verificarDocumentos,
    onSuccess: (r) => {
      setFeedback(`Documentos: ${r.documentosAlertados} notificacao(oes) disparada(s).`);
      setErro('');
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
    onError: (e) => { setErro(getApiError(e)); setFeedback(''); },
  });

  const parcelasMutation = useMutation({
    mutationFn: verificarParcelas,
    onSuccess: (r) => {
      setFeedback(`Parcelas: ${r.vencidas} vencida(s) + ${r.proximasAVencer} proxima(s) a vencer alertada(s).`);
      setErro('');
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
    onError: (e) => { setErro(getApiError(e)); setFeedback(''); },
  });

  const conectado = status?.conectado ?? false;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Automacao WhatsApp</h1>
      </div>

      {feedback && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <CheckCircle size={16} className="mt-0.5 shrink-0" />
          {feedback}
          <button className="ml-auto" onClick={() => setFeedback('')}><X size={14} /></button>
        </div>
      )}
      {erro && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <XCircle size={16} className="mt-0.5 shrink-0" />
          {erro}
          <button className="ml-auto" onClick={() => setErro('')}><X size={14} /></button>
        </div>
      )}

      {/* Status de conexao */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loadingStatus ? (
          <div className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        ) : (
          <div className={`kpi-card ${conectado ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white/80">Conexao WhatsApp</p>
                <p className="mt-1 text-xl font-bold text-white">{conectado ? 'Conectado via API' : 'Modo simulado'}</p>
                <p className="mt-0.5 text-xs text-white/60">{status?.endpoint ?? '-'}</p>
              </div>
              <div className="rounded-lg bg-white/20 p-2">
                {conectado ? <Wifi size={22} className="text-white" /> : <WifiOff size={22} className="text-white" />}
              </div>
            </div>
          </div>
        )}

        <div className={`kpi-card bg-gradient-to-br ${logs && logs.filter((l) => l.status === 'ENVIADA').length > 0 ? 'from-brand-500 to-brand-700' : 'from-slate-500 to-slate-700'}`}>
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white/80">Mensagens enviadas</p>
              <p className="mt-1 text-3xl font-bold text-white">
                {loadingLogs ? '-' : (logs?.filter((l) => l.status === 'ENVIADA').length ?? 0)}
              </p>
              <p className="mt-0.5 text-xs text-white/60">ultimas 100 notificacoes</p>
            </div>
            <div className="rounded-lg bg-white/20 p-2">
              <MessageCircle size={22} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Acoes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Teste de mensagem */}
        <div className="card">
          <div className="section-title">
            <Send size={16} className="text-brand-500" />
            Enviar mensagem de teste
          </div>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Valida a conexao enviando uma mensagem para o numero informado.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-8"
                type="tel"
                placeholder="11999999999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            <button
              className="btn-primary shrink-0"
              onClick={() => testeMutation.mutate()}
              disabled={testeMutation.isPending || !telefone.trim()}
            >
              {testeMutation.isPending ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Testar
            </button>
          </div>
        </div>

        {/* Verificar estoque */}
        <div className="card">
          <div className="section-title">
            <Package size={16} className="text-amber-500" />
            Estoque parado
          </div>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Alerta para veiculos em estoque ha mais de 60 dias.
          </p>
          <button
            className="btn-secondary w-full"
            onClick={() => estoqueMutation.mutate()}
            disabled={estoqueMutation.isPending}
          >
            {estoqueMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Package size={16} />}
            Verificar
          </button>
        </div>

        {/* Documentos pendentes */}
        <div className="card">
          <div className="section-title">
            <FileWarning size={16} className="text-rose-500" />
            Documentos pendentes
          </div>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Notifica clientes com documentos ainda nao entregues.
          </p>
          <button
            className="btn-secondary w-full"
            onClick={() => docsMutation.mutate()}
            disabled={docsMutation.isPending}
          >
            {docsMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <FileWarning size={16} />}
            Verificar
          </button>
        </div>

        {/* Parcelas vencidas */}
        <div className="card">
          <div className="section-title">
            <DollarSign size={16} className="text-violet-500" />
            Parcelas vencidas
          </div>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Alerta clientes com parcelas vencidas ou vencem em 3 dias.
          </p>
          <button
            className="btn-secondary w-full"
            onClick={() => parcelasMutation.mutate()}
            disabled={parcelasMutation.isPending}
          >
            {parcelasMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <DollarSign size={16} />}
            Verificar
          </button>
        </div>
      </div>

      {/* Como configurar */}
      {!conectado && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-900/20">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <WifiOff size={16} />
            Numero nao conectado — modo simulado ativo
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Para ativar o envio real, configure no arquivo <strong>.env</strong> do backend:
          </p>
          <pre className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
{`DATAFY_API_URL=https://cloud.datafyapi.com.br
DATAFY_API_TOKEN=sk_live_seu_token_aqui`}
          </pre>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            Obtenha seu token em <strong>datafyapi.com.br</strong> — conecte seu numero WhatsApp la e cole o token acima.
          </p>
        </div>
      )}

      {/* Log de notificacoes */}
      <div>
        <div className="section-title mb-4">
          <MessageCircle size={16} className="text-brand-500" />
          Historico de mensagens
        </div>

        {loadingLogs ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />)}
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Destinatario</th>
                  <th className="px-4 py-3">Mensagem</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {!logs?.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      Nenhuma notificacao registrada ainda.
                    </td>
                  </tr>
                )}
                {logs?.map((n) => {
                  const s = STATUS_CONFIG[n.status] ?? STATUS_CONFIG.SIMULADA;
                  const SIcon = s.icon;
                  return (
                    <tr key={n.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatData(n.criadoEm)}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {TIPO_LABEL[n.tipo] ?? n.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{n.destino ?? '-'}</td>
                      <td className="max-w-xs px-4 py-3 text-slate-500 truncate">{n.mensagem}</td>
                      <td className="px-4 py-3">
                        <span className={`badge flex w-fit items-center gap-1 ${s.cls}`}>
                          <SIcon size={11} />
                          {s.label}
                        </span>
                        {n.erro && <p className="mt-0.5 text-xs text-rose-500">{n.erro}</p>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
