export type Perfil = 'ADMIN' | 'VENDEDOR' | 'FINANCEIRO' | 'DOCUMENTAL';

export type Combustivel = 'FLEX' | 'GASOLINA' | 'DIESEL' | 'ELETRICO' | 'HIBRIDO';

export type SituacaoVeiculo = 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO';

export type TipoCliente = 'COMPRADOR' | 'VENDEDOR' | 'AMBOS';

export type FormaPagamento = 'AVISTA' | 'FINANCIADO' | 'PERMUTA' | 'MISTO';

export type TipoLancamento = 'ENTRADA' | 'SAIDA';

export type StatusDocumento = 'PENDENTE' | 'RECEBIDO' | 'CONCLUIDO';

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
  valorFipe?: number;
  codigoFipe?: string;
  fonte: string;
  simulado: boolean;
  aviso?: string;
}

export interface ConsultaPlacaFipeChassiResult {
  placa: string;
  chassi: string;
  marca: string;
  modelo: string;
  anoFabricacao?: number;
  anoModelo?: number;
  codigoFipe?: string;
  valor?: number;
  valorTexto?: string;
  combustivel?: string;
  homologado?: boolean;
  fonte: 'apibrasil';
  raw: {
    cor?: string;
    combustivel?: string;
    [key: string]: unknown;
  };
}

export interface ConsultaFipeBetaResult {
  placa: string;
  marca: string;
  modelo: string;
  anoFabricacao?: number;
  anoModelo?: number;
  codigoFipe?: string;
  valor?: number;
  combustivel?: string;
  categoria?: string;
  mesReferencia?: string;
  url?: string;
  ipva?: {
    aliquota?: number;
    uf?: string;
    valor?: number;
    valorFormatado?: string;
  };
  historico: { mes: string; valor: number }[];
  veiculo?: {
    chassi?: string;
    combustivel?: string;
    cor?: string;
    uf?: string;
    tipoVeiculo?: string;
    [key: string]: unknown;
  };
  homologado?: boolean;
  fonte: 'apibrasil';
  raw: Record<string, unknown>;
}

export interface ConsultaDebitosResult {
  placa: string;
  ipva: { ano: number; valor: number; pago: boolean };
  licenciamento: { ano: number; valor: number; situacao: string };
  multas: { descricao: string; valor: number; data?: string }[];
  restricoes: string[];
  totalDebitos: number;
  fonte: string;
  simulado: boolean;
  consultadoEm: string;
  aviso?: string;
}

export interface ConsultaDocumentoResult {
  documento: string;
  tipo: 'CPF' | 'CNPJ' | 'INVALIDO';
  valido: boolean;
  formatado: string;
  nome?: string;
  nomeFantasia?: string;
  situacao?: string;
  fonte: string;
  simulado: boolean;
}

export interface Documento {
  id: string;
  tipo: string;
  status: StatusDocumento;
  nomeArquivo?: string | null;
  mimeType?: string | null;
  tamanho?: number | null;
  observacoes?: string | null;
  veiculoId?: string | null;
  clienteId?: string | null;
  criadoEm: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  filialId?: string | null;
}

export interface Filial {
  id: string;
  nome: string;
  cnpj?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  ativa: boolean;
}

export interface CustoAdicional {
  id: string;
  descricao: string;
  categoria?: string | null;
  valor: number;
}

export interface Foto {
  id: string;
  url: string;
  legenda?: string | null;
  ordem: number;
}

export interface Veiculo {
  id: string;
  placa: string;
  renavam: string;
  chassi: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  combustivel: Combustivel;
  quilometragem: number;
  dataEntrada: string;
  valorCompra: number;
  valorVendaSugerido?: number | null;
  situacao: SituacaoVeiculo;
  observacoes?: string | null;
  propNome: string;
  propCpfCnpj: string;
  propTelefone?: string | null;
  propEndereco?: string | null;
  custos: CustoAdicional[];
  fotos: Foto[];
  custoTotal: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  rg?: string | null;
  cnh?: string | null;
  dataNascimento?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  tipo: TipoCliente;
  observacoes?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CompraHistorico {
  id: string;
  dataVenda: string;
  valorTotal: number;
  formaPagamento: FormaPagamento;
  veiculo: { id: string; marca: string; modelo: string; placa: string };
  vendedor: { id: string; nome: string };
}

export interface ClienteDetalhe extends Cliente {
  compras: CompraHistorico[];
}

export interface Venda {
  id: string;
  veiculoId: string;
  compradorId: string;
  vendedorId: string;
  dataVenda: string;
  valorTotal: number;
  formaPagamento: FormaPagamento;
  observacoes?: string | null;
  custoTotalSnapshot: number;
  lucroBruto: number;
  comprador?: { id: string; nome: string; cpfCnpj?: string };
  vendedor?: { id: string; nome: string };
}

export interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  valor: number;
  data: string;
  categoria: string;
  descricao?: string | null;
  formaPagamento?: string | null;
  veiculo?: { id: string; marca: string; modelo: string; placa: string } | null;
  cliente?: { id: string; nome: string } | null;
}

export interface ResumoCaixa {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
}

export interface DashboardData {
  cards: {
    veiculosEmEstoque: number;
    vendidosNoMes: number;
    faturamentoMes: number;
    lucroBrutoMes: number;
    saldoCaixa: number;
    documentacaoPendente: number;
  };
  distribuicaoSituacao: Record<string, number>;
  vendasPorMes: { mes: string; faturamento: number; custo: number; lucro: number; qtd: number }[];
  rankingVendedores: { nome: string; faturamento: number; quantidade: number }[];
}
