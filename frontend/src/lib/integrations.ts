import { api } from './api';
import {
  ConsultaDebitosResult,
  ConsultaDocumentoResult,
  ConsultaFipeBetaResult,
  ConsultaPlacaFipeChassiResult,
  ConsultaVeiculoResult,
} from '../types';

export async function consultarVeiculoPorPlaca(placa: string): Promise<ConsultaVeiculoResult> {
  const { data } = await api.get<ConsultaVeiculoResult>(`/integracoes/veiculo/${encodeURIComponent(placa)}`);
  return data;
}

export async function consultarPlacaFipeComChassi(
  placa: string,
  homolog = false,
): Promise<ConsultaPlacaFipeChassiResult> {
  const { data } = await api.post<ConsultaPlacaFipeChassiResult>('/integracoes/placa-fipe-chassi', {
    placa,
    homolog,
  });
  return data;
}

export async function consultarFipeBeta(placa: string, homolog = false): Promise<ConsultaFipeBetaResult> {
  const { data } = await api.post<ConsultaFipeBetaResult>('/integracoes/fipe-beta', {
    placa,
    homolog,
  });
  return data;
}

export async function consultarDebitos(placa: string, veiculoId?: string): Promise<ConsultaDebitosResult> {
  const { data } = await api.get<ConsultaDebitosResult>(`/integracoes/debitos/${encodeURIComponent(placa)}`, {
    params: veiculoId ? { veiculoId } : {},
  });
  return data;
}

export async function consultarDocumento(doc: string): Promise<ConsultaDocumentoResult> {
  const { data } = await api.get<ConsultaDocumentoResult>(`/integracoes/documento/${encodeURIComponent(doc)}`);
  return data;
}
