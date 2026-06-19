import { api } from './api';

export interface Periodo {
  inicio?: string;
  fim?: string;
  filialId?: string;
}

function params(p: Periodo) {
  const out: Record<string, string> = {};
  if (p.inicio) out.inicio = p.inicio;
  if (p.fim) out.fim = p.fim;
  if (p.filialId) out.filialId = p.filialId;
  return out;
}

export async function getRelatorio(tipo: string, p: Periodo): Promise<any[]> {
  const { data } = await api.get(`/relatorios/${tipo}`, { params: params(p) });
  return data;
}

export async function getFaturamento(p: Periodo) {
  const { data } = await api.get('/relatorios/faturamento', { params: params(p) });
  return data as { quantidade: number; faturamento: number; custo: number; lucro: number };
}

/** Baixa a exportação (Excel/PDF) de um relatório, enviando o JWT. */
export async function exportRelatorio(tipo: string, formato: 'excel' | 'pdf', p: Periodo): Promise<void> {
  const resp = await api.get(`/relatorios/${tipo}/export`, {
    params: { ...params(p), formato },
    responseType: 'blob',
  });
  const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
  const url = window.URL.createObjectURL(resp.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tipo}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
}
