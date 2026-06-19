import { api } from './api';
import { ConsultaDebitosResult, ConsultaDocumentoResult, ConsultaVeiculoResult } from '../types';

export async function consultarVeiculoPorPlaca(placa: string): Promise<ConsultaVeiculoResult> {
  const { data } = await api.get<ConsultaVeiculoResult>(`/integracoes/veiculo/${encodeURIComponent(placa)}`);
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
