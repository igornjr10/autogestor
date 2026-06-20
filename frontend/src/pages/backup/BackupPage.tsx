import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, Download, Play, CheckCircle, AlertCircle, Clock, Database } from 'lucide-react';
import { api } from '../../lib/api';

interface BackupEntry {
  nome: string;
  tamanhoBytes: number;
  criadoEm: string;
}

interface BackupResult {
  arquivo: string;
  tamanhoBytes: number;
  duracaoMs: number;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function formatData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function BackupPage() {
  const qc = useQueryClient();
  const [ultimo, setUltimo] = useState<BackupResult | null>(null);

  const { data: backups = [], isLoading } = useQuery<BackupEntry[]>({
    queryKey: ['backups'],
    queryFn: () => api.get('/backup/listar').then((r) => r.data),
  });

  const { mutate: executar, isPending } = useMutation<BackupResult>({
    mutationFn: () => api.post('/backup/executar').then((r) => r.data),
    onSuccess: (data) => {
      setUltimo(data);
      qc.invalidateQueries({ queryKey: ['backups'] });
    },
  });

  function download(nome: string) {
    window.open(`${import.meta.env.VITE_API_URL ?? '/api'}/backup/${nome}/download`, '_blank');
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <HardDrive size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Backup do sistema</h1>
            <p className="text-xs text-slate-500">Backup automático todo dia às 02:00 · retenção de 7 dias</p>
          </div>
        </div>
        <button
          onClick={() => executar()}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
        >
          <Play size={15} />
          {isPending ? 'Gerando backup…' : 'Backup agora'}
        </button>
      </div>

      {/* Resultado do último backup manual */}
      {ultimo && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl p-4"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <CheckCircle size={18} className="mt-0.5 shrink-0 text-green-400" />
          <div>
            <p className="text-sm font-semibold text-green-300">Backup concluído com sucesso</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {ultimo.arquivo} · {formatBytes(ultimo.tamanhoBytes)} · {ultimo.duracaoMs}ms
            </p>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total de backups', value: backups.length, icon: Database, color: '#818cf8' },
          { label: 'Retenção', value: '7 dias', icon: Clock, color: '#facc15' },
          { label: 'Próximo automático', value: '02:00', icon: HardDrive, color: '#4ade80' },
        ].map((k) => (
          <div key={k.label} className="flex items-center gap-4 rounded-2xl p-4"
            style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.06)' }}>
            <k.icon size={22} style={{ color: k.color }} />
            <div>
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className="text-lg font-bold text-slate-100">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de backups */}
      <div className="overflow-hidden rounded-2xl" style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm font-semibold text-slate-200">Arquivos disponíveis</p>
          <p className="text-xs text-slate-500">{backups.length} backup{backups.length !== 1 ? 's' : ''}</p>
        </div>

        {isLoading && (
          <div className="space-y-2 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        )}

        {!isLoading && backups.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-14 text-slate-500">
            <HardDrive size={40} className="opacity-20" />
            <p className="text-sm">Nenhum backup encontrado.</p>
            <p className="text-xs">O primeiro backup automático ocorre às 02:00.</p>
          </div>
        )}

        {!isLoading && backups.length > 0 && (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {backups.map((b, i) => (
              <div key={b.nome} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: i === 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)' }}>
                    <Database size={14} style={{ color: i === 0 ? '#818cf8' : '#475569' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{b.nome}</p>
                    <p className="text-xs text-slate-500">{formatData(b.criadoEm)} · {formatBytes(b.tamanhoBytes)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {i === 0 && (
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                      Mais recente
                    </span>
                  )}
                  <button
                    onClick={() => download(b.nome)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <Download size={13} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aviso */}
      <div className="mt-4 flex items-start gap-2 rounded-xl p-3 text-xs text-slate-500"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <AlertCircle size={13} className="mt-0.5 shrink-0" />
        Os backups são arquivos <strong className="text-slate-400">.sql.gz</strong> (PostgreSQL comprimido).
        Para restaurar, descomprima e execute no banco com <code className="text-indigo-400">psql</code>.
        Backups com mais de 7 dias são removidos automaticamente.
      </div>
    </div>
  );
}
