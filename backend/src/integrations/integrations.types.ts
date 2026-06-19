import { Combustivel } from '@prisma/client';

/** Resultado normalizado da consulta de dados do veículo por placa. */
export interface ConsultaVeiculoResult {
  placa: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  chassi: string;
  renavam: string;
  combustivel?: Combustivel;
  /** Valor de referência FIPE (R$), quando disponível. */
  valorFipe?: number;
  /** Código FIPE da versão, quando disponível. */
  codigoFipe?: string;
  /** Provedor que originou os dados (ex.: 'consultarplaca', 'simulado'). */
  fonte: string;
  /** true quando os dados são simulados (provedor sem credenciais). */
  simulado: boolean;
  /** Motivo do fallback (ex.: sem créditos, sem chave). */
  aviso?: string;
}

export interface Multa {
  descricao: string;
  valor: number;
  data?: string;
}

export interface ConsultaDebitosResult {
  placa: string;
  ipva: { ano: number; valor: number; pago: boolean };
  licenciamento: { ano: number; valor: number; situacao: string };
  multas: Multa[];
  restricoes: string[];
  totalDebitos: number;
  fonte: string;
  simulado: boolean;
  consultadoEm: string;
  /** Motivo do fallback ou estado (ex.: sem créditos, em processamento). */
  aviso?: string;
}

/** Resultado da consulta cadastral de um CPF/CNPJ (Receita). */
export interface ConsultaDocumentoResult {
  documento: string;
  tipo: 'CPF' | 'CNPJ' | 'INVALIDO';
  valido: boolean;
  formatado: string;
  /** Nome (CPF) ou Razão Social (CNPJ), quando disponível. */
  nome?: string;
  /** Nome fantasia (CNPJ). */
  nomeFantasia?: string;
  /** Situação cadastral (ex.: Regular, Ativa, Suspensa). */
  situacao?: string;
  fonte: string;
  simulado: boolean;
}
