const digitos = (v: string) => (v ?? '').replace(/\D/g, '');

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

/** Valida CPF (11 díg.) ou CNPJ (14 díg.). Retorna true se qualquer um for válido. */
export function validarCpfCnpj(valor: string): boolean {
  const d = digitos(valor);
  if (d.length === 11) return validarCpf(d);
  if (d.length === 14) return validarCnpj(d);
  return false;
}

export function formatarDocumento(valor: string): string {
  const d = digitos(valor);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return valor;
}
