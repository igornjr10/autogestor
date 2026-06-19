import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDocument,
  deleteDocument,
  listDocuments,
  openDocumentFile,
  updateDocumentStatus,
  uploadDocumentFile,
} from '../lib/documents';
import { getApiError } from '../lib/api';
import { StatusDocumento } from '../types';
import { useAuth } from '../auth/AuthContext';

const STATUS_BADGE: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  RECEBIDO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  CONCLUIDO: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

const TIPOS_SUGERIDOS = ['RG', 'CPF', 'CNH', 'Comprovante de residência', 'CRV/DUT', 'Laudo de vistoria', 'ATPV assinada', 'Contrato'];

export function DocumentsPanel({ veiculoId, clienteId }: { veiculoId?: string; clienteId?: string }) {
  const queryClient = useQueryClient();
  const { temPerfil } = useAuth();
  const [erro, setErro] = useState('');
  const [novoTipo, setNovoTipo] = useState('');
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const podeGerenciar = temPerfil('ADMIN', 'DOCUMENTAL', 'VENDEDOR');
  const chave = veiculoId ? { veiculoId } : { clienteId: clienteId! };

  const { data: docs } = useQuery({
    queryKey: ['documentos', chave],
    queryFn: () => listDocuments(chave),
  });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['documentos', chave] });
  }

  const criar = useMutation({
    mutationFn: () => createDocument({ tipo: novoTipo, ...chave }),
    onSuccess: () => {
      setNovoTipo('');
      invalidar();
    },
    onError: (e) => setErro(getApiError(e)),
  });

  const upload = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadDocumentFile(id, file),
    onSuccess: invalidar,
    onError: (e) => setErro(getApiError(e)),
  });

  const mudarStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusDocumento }) => updateDocumentStatus(id, status),
    onSuccess: invalidar,
    onError: (e) => setErro(getApiError(e)),
  });

  const remover = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: invalidar,
    onError: (e) => setErro(getApiError(e)),
  });

  return (
    <section className="card">
      <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">Documentos ({docs?.length ?? 0})</h2>

      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

      {podeGerenciar && (
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label className="label">Adicionar documento</label>
            <input
              className="input"
              list="tipos-doc"
              placeholder="Ex: ATPV assinada"
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value)}
            />
            <datalist id="tipos-doc">
              {TIPOS_SUGERIDOS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <button
            className="btn-primary"
            disabled={novoTipo.trim().length < 2 || criar.isPending}
            onClick={() => criar.mutate()}
          >
            + Adicionar
          </button>
        </div>
      )}

      {docs && docs.length === 0 && <p className="text-sm text-gray-500">Nenhum documento.</p>}

      <ul className="space-y-2">
        {docs?.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2 dark:border-gray-700">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 dark:text-gray-100">{d.tipo}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[d.status]}`}>
                  {d.status}
                </span>
              </div>
              {d.nomeArquivo && (
                <button className="text-xs text-blue-600 hover:underline" onClick={() => openDocumentFile(d.id).catch((e) => setErro(getApiError(e)))}>
                  {d.nomeArquivo}
                </button>
              )}
            </div>

            {podeGerenciar && (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  className="hidden"
                  ref={(el) => (fileInputs.current[d.id] = el)}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload.mutate({ id: d.id, file });
                    e.target.value = '';
                  }}
                />
                <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => fileInputs.current[d.id]?.click()}>
                  {d.nomeArquivo ? 'Trocar' : 'Anexar'}
                </button>
                <select
                  className="input !w-auto !py-1 text-xs"
                  value={d.status}
                  onChange={(e) => mudarStatus.mutate({ id: d.id, status: e.target.value as StatusDocumento })}
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="RECEBIDO">Recebido</option>
                  <option value="CONCLUIDO">Concluído</option>
                </select>
                <button
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => window.confirm('Excluir este documento?') && remover.mutate(d.id)}
                >
                  excluir
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
