import { api } from './api';
import { DashboardData } from '../types';

export async function getDashboard(filialId?: string): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/dashboard', {
    params: filialId ? { filialId } : {},
  });
  return data;
}
