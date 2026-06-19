import { api } from './api';
import { Veiculo } from '../types';

export interface VehicleFilters {
  situacao?: string;
  marca?: string;
  busca?: string;
  filialId?: string;
}

export async function listVehicles(filters: VehicleFilters): Promise<Veiculo[]> {
  const params: Record<string, string> = {};
  if (filters.situacao) params.situacao = filters.situacao;
  if (filters.marca) params.marca = filters.marca;
  if (filters.busca) params.busca = filters.busca;
  if (filters.filialId) params.filialId = filters.filialId;
  const { data } = await api.get<Veiculo[]>('/veiculos', { params });
  return data;
}

export async function getVehicle(id: string): Promise<Veiculo> {
  const { data } = await api.get<Veiculo>(`/veiculos/${id}`);
  return data;
}

export async function createVehicle(payload: unknown): Promise<Veiculo> {
  const { data } = await api.post<Veiculo>('/veiculos', payload);
  return data;
}

export async function updateVehicle(id: string, payload: unknown): Promise<Veiculo> {
  const { data } = await api.patch<Veiculo>(`/veiculos/${id}`, payload);
  return data;
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/veiculos/${id}`);
}
