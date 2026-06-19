import { api } from './api';

export interface FipeItem {
  codigo: string | number;
  nome: string;
}

export interface FipePreco {
  valor: number | null;
  valorTexto: string | null;
  marca?: string;
  modelo?: string;
  anoModelo?: number;
  combustivel?: string;
  codigoFipe?: string;
  mesReferencia?: string;
}

export async function fipeMarcas(tipo: string): Promise<FipeItem[]> {
  const { data } = await api.get<FipeItem[]>('/fipe/marcas', { params: { tipo } });
  return data;
}

export async function fipeModelos(tipo: string, marca: string): Promise<FipeItem[]> {
  const { data } = await api.get<FipeItem[]>('/fipe/modelos', { params: { tipo, marca } });
  return data;
}

export async function fipeAnos(tipo: string, marca: string, modelo: string): Promise<FipeItem[]> {
  const { data } = await api.get<FipeItem[]>('/fipe/anos', { params: { tipo, marca, modelo } });
  return data;
}

export async function fipePreco(tipo: string, marca: string, modelo: string, ano: string): Promise<FipePreco> {
  const { data } = await api.get<FipePreco>('/fipe/preco', { params: { tipo, marca, modelo, ano } });
  return data;
}
