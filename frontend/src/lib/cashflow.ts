import { api } from './api';
import { Lancamento, ResumoCaixa } from '../types';

export interface CashFilters {
  inicio?: string;
  fim?: string;
  tipo?: string;
  categoria?: string;
  filialId?: string;
}

function toParams(filters: CashFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.inicio) params.inicio = filters.inicio;
  if (filters.fim) params.fim = filters.fim;
  if (filters.tipo) params.tipo = filters.tipo;
  if (filters.categoria) params.categoria = filters.categoria;
  if (filters.filialId) params.filialId = filters.filialId;
  return params;
}

export async function listLancamentos(filters: CashFilters): Promise<Lancamento[]> {
  const { data } = await api.get<Lancamento[]>('/caixa/lancamentos', { params: toParams(filters) });
  return data;
}

export async function getResumo(filters: CashFilters): Promise<ResumoCaixa> {
  const { data } = await api.get<ResumoCaixa>('/caixa/resumo', { params: toParams(filters) });
  return data;
}

export async function getCategorias(): Promise<{ ENTRADA: string[]; SAIDA: string[] }> {
  const { data } = await api.get('/caixa/categorias');
  return data;
}

export async function createLancamento(payload: unknown): Promise<Lancamento> {
  const { data } = await api.post<Lancamento>('/caixa/lancamentos', payload);
  return data;
}

export async function deleteLancamento(id: string): Promise<void> {
  await api.delete(`/caixa/lancamentos/${id}`);
}
