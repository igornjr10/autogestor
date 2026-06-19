import { api } from './api';

export type StatusParcela = 'PENDENTE' | 'PAGO' | 'ATRASADO';

export interface Parcela {
  id: string;
  vendaId: string;
  numero: number;
  valor: number;
  vencimento: string;
  dataPagamento?: string;
  status: StatusParcela;
  observacoes?: string;
  criadoEm: string;
  venda: {
    id: string;
    comprador: { id: string; nome: string; telefone?: string };
    veiculo: { id: string; marca: string; modelo: string; placa: string };
  };
}

export interface ParcelaResumo {
  status: StatusParcela;
  _count: { id: number };
  _sum: { valor: number | null };
}

export async function listParcelas(filters?: { vendaId?: string; status?: StatusParcela }): Promise<Parcela[]> {
  const params: Record<string, string> = {};
  if (filters?.vendaId) params.vendaId = filters.vendaId;
  if (filters?.status) params.status = filters.status;
  const { data } = await api.get<Parcela[]>('/parcelas', { params });
  return data;
}

export async function getParcelasResumo(): Promise<ParcelaResumo[]> {
  const { data } = await api.get<ParcelaResumo[]>('/parcelas/resumo');
  return data;
}

export async function createParcela(payload: {
  vendaId: string;
  numero: number;
  valor: number;
  vencimento: string;
  observacoes?: string;
}): Promise<Parcela> {
  const { data } = await api.post<Parcela>('/parcelas', payload);
  return data;
}

export async function marcarPago(id: string): Promise<Parcela> {
  const { data } = await api.patch<Parcela>(`/parcelas/${id}/pagar`);
  return data;
}

export async function deleteParcela(id: string): Promise<void> {
  await api.delete(`/parcelas/${id}`);
}
