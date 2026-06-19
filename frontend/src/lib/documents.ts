import { api } from './api';
import { Documento, StatusDocumento } from '../types';

export async function listDocuments(params: { veiculoId?: string; clienteId?: string }): Promise<Documento[]> {
  const { data } = await api.get<Documento[]>('/documentos', { params });
  return data;
}

export async function createDocument(payload: {
  tipo: string;
  veiculoId?: string;
  clienteId?: string;
  observacoes?: string;
}): Promise<Documento> {
  const { data } = await api.post<Documento>('/documentos', payload);
  return data;
}

export async function uploadDocumentFile(id: string, file: File): Promise<Documento> {
  const form = new FormData();
  form.append('arquivo', file);
  const { data } = await api.post<Documento>(`/documentos/${id}/arquivo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateDocumentStatus(id: string, status: StatusDocumento): Promise<Documento> {
  const { data } = await api.patch<Documento>(`/documentos/${id}`, { status });
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documentos/${id}`);
}

/** Baixa/abre um arquivo protegido (envia o JWT) em nova aba. */
export async function openDocumentFile(id: string): Promise<void> {
  const resp = await api.get(`/documentos/${id}/arquivo`, { responseType: 'blob' });
  abrirBlob(resp.data);
}

/** Gera e abre o contrato em PDF do veículo. */
export async function openContrato(veiculoId: string): Promise<void> {
  const resp = await api.get(`/documentos/contrato/${veiculoId}`, { responseType: 'blob' });
  abrirBlob(resp.data);
}

function abrirBlob(data: Blob) {
  const url = window.URL.createObjectURL(data);
  window.open(url, '_blank');
  // Libera após um tempo para o navegador carregar
  setTimeout(() => window.URL.revokeObjectURL(url), 60000);
}
