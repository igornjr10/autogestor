import { api } from './api';
import { Filial } from '../types';

export async function listFiliais(): Promise<Filial[]> {
  const { data } = await api.get<Filial[]>('/filiais');
  return data;
}

export async function createFilial(payload: Partial<Filial>): Promise<Filial> {
  const { data } = await api.post<Filial>('/filiais', payload);
  return data;
}

export async function updateFilial(id: string, payload: Partial<Filial>): Promise<Filial> {
  const { data } = await api.patch<Filial>(`/filiais/${id}`, payload);
  return data;
}

export async function deleteFilial(id: string, force = false): Promise<void> {
  await api.delete(`/filiais/${id}`, { params: force ? { force: 'true' } : undefined });
}
