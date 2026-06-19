import { api } from './api';
import { Cliente, ClienteDetalhe } from '../types';

export interface ClientFilters {
  tipo?: string;
  busca?: string;
}

export async function listClients(filters: ClientFilters): Promise<Cliente[]> {
  const params: Record<string, string> = {};
  if (filters.tipo) params.tipo = filters.tipo;
  if (filters.busca) params.busca = filters.busca;
  const { data } = await api.get<Cliente[]>('/clientes', { params });
  return data;
}

export async function getClient(id: string): Promise<ClienteDetalhe> {
  const { data } = await api.get<ClienteDetalhe>(`/clientes/${id}`);
  return data;
}

export async function createClient(payload: unknown): Promise<Cliente> {
  const { data } = await api.post<Cliente>('/clientes', payload);
  return data;
}

export async function updateClient(id: string, payload: unknown): Promise<Cliente> {
  const { data } = await api.patch<Cliente>(`/clientes/${id}`, payload);
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clientes/${id}`);
}
