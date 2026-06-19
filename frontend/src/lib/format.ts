export function formatMoeda(valor?: number | null): string {
  if (valor == null) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatData(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function formatKm(km: number): string {
  return `${km.toLocaleString('pt-BR')} km`;
}

export const SITUACAO_LABEL: Record<string, string> = {
  DISPONIVEL: 'Disponível',
  RESERVADO: 'Reservado',
  VENDIDO: 'Vendido',
};

export const SITUACAO_BADGE: Record<string, string> = {
  DISPONIVEL: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  RESERVADO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  VENDIDO: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
};

export const COMBUSTIVEIS = ['FLEX', 'GASOLINA', 'DIESEL', 'ELETRICO', 'HIBRIDO'] as const;

export const TIPO_CLIENTE_LABEL: Record<string, string> = {
  COMPRADOR: 'Comprador',
  VENDEDOR: 'Vendedor (antigo proprietário)',
  AMBOS: 'Ambos',
};

export const TIPOS_CLIENTE = ['COMPRADOR', 'VENDEDOR', 'AMBOS'] as const;

export const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  AVISTA: 'À vista',
  FINANCIADO: 'Financiado',
  PERMUTA: 'Permuta',
  MISTO: 'Misto',
};

export const FORMAS_PAGAMENTO = ['AVISTA', 'FINANCIADO', 'PERMUTA', 'MISTO'] as const;
