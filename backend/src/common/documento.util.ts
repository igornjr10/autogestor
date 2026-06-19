export type TipoDocumento = 'CPF' | 'CNPJ' | 'INVALIDO';

export interface ValidacaoDocumento {
  documento: string;
  tipo: TipoDocumento;
  valido: boolean;
  formatado: string;
}

const digitos = (v: string) => (v ?? '').replace(/\D/g, '');

/** Valida os dígitos verificadores do CPF. */
export function validarCpf(valor: string): boolean {
  const cpf = digitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (qtd: number) => {
    let soma = 0;
    for (let i = 0; i < qtd; i++) soma += Number(cpf[i]) * (qtd + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

/** Valida os dígitos verificadores do CNPJ. */
export function validarCnpj(valor: string): boolean {
  const cnpj = digitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calc = (qtd: number) => {
    const pesos = qtd === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < qtd; i++) soma += Number(cnpj[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

/** Formata CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00). */
export function formatarDocumento(valor: string): string {
  const d = digitos(valor);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return valor;
}

/** Detecta o tipo pelo tamanho e valida. */
export function validarDocumento(valor: string): ValidacaoDocumento {
  const d = digitos(valor);
  let tipo: TipoDocumento = 'INVALIDO';
  let valido = false;

  if (d.length === 11) {
    tipo = 'CPF';
    valido = validarCpf(d);
  } else if (d.length === 14) {
    tipo = 'CNPJ';
    valido = validarCnpj(d);
  }

  return { documento: d, tipo, valido, formatado: valido ? formatarDocumento(d) : valor };
}
