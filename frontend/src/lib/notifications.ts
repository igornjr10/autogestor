import { api } from './api';

export interface NotificacaoStatus {
  conectado: boolean;
  modo: 'API' | 'SIMULADO';
  endpoint: string;
}

export interface Notificacao {
  id: string;
  tipo: string;
  destino?: string;
  mensagem: string;
  status: 'ENVIADA' | 'FALHOU' | 'SIMULADA';
  erro?: string;
  veiculoId?: string;
  criadoEm: string;
}

export interface VerificarEstoqueResult {
  veiculosAlertados: number;
}

export async function getStatus(): Promise<NotificacaoStatus> {
  const { data } = await api.get<NotificacaoStatus>('/notificacoes/status');
  return data;
}

export async function listarNotificacoes(): Promise<Notificacao[]> {
  const { data } = await api.get<Notificacao[]>('/notificacoes');
  return data;
}

export async function enviarTeste(telefone: string): Promise<Notificacao> {
  const { data } = await api.post<Notificacao>('/notificacoes/teste', { telefone });
  return data;
}

export async function verificarEstoque(): Promise<VerificarEstoqueResult> {
  const { data } = await api.post<VerificarEstoqueResult>('/notificacoes/verificar-estoque');
  return data;
}

export async function verificarDocumentos(): Promise<{ documentosAlertados: number }> {
  const { data } = await api.post('/notificacoes/verificar-documentos');
  return data;
}

export async function verificarParcelas(): Promise<{ vencidas: number; proximasAVencer: number }> {
  const { data } = await api.post('/notificacoes/verificar-parcelas');
  return data;
}
