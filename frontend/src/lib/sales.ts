import { api } from './api';
import { Venda } from '../types';

export async function createSale(payload: unknown): Promise<Venda> {
  const { data } = await api.post<Venda>('/vendas', payload);
  return data;
}

export async function getSaleByVehicle(veiculoId: string): Promise<Venda | null> {
  const { data } = await api.get<Venda | null>('/vendas', { params: { veiculoId } });
  return data;
}

export async function listSales(): Promise<Venda[]> {
  const { data } = await api.get<Venda[]>('/vendas');
  return data;
}
