/**
 * Consulta cada placa via API de produção (integração ConsultarPlaca)
 * e cria/atualiza o veículo com dados reais.
 *
 * Executar: ts-node prisma/consultar-e-salvar-placas.ts
 */

const BASE_URL = 'https://autogestor.cloud/api';
const ADMIN_EMAIL = 'admin@gestao.com';
const ADMIN_SENHA = 'admin123';

const PLACAS = [
  'PTM 4B84',
  'RQD 8E28',
  'PSH 5R87',
  'ROF 3J46',
  'RWZ 8E80',
  'ROF 3I12',
  'DFM 0H41',
  'RWV 1A41',
  'ROJ 5J06',
  'QVQ 8G51',
  'PTC 8F69',
  'PSK 0275',
  'TVS 1A65',
  'TUC 5856',
  'QWB 0J89',
  'ROL 2F36',
  'PTE 7C61',
  'SBL 4J71',
  'ROG 7C83',
  'ROP 5G71',
  'PLM 357',
  'ROK 5B30',
  'SNJ 6E12',
  'SZQ 7B82',
  'PSS 1280',
  'ROG 5C79',
  'QEH 3D61',
  'QVU 5J65',
  'PTP 3E58',
  'RQU 3J19',
];

async function login(): Promise<string> {
  const resp = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, senha: ADMIN_SENHA }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Login falhou (${resp.status}): ${body}`);
  }
  const json: any = await resp.json();
  return json.accessToken;
}

async function getFilialId(token: string): Promise<string> {
  const resp = await fetch(`${BASE_URL}/filiais`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Falha ao buscar filiais: ${resp.status}`);
  const json: any = await resp.json();
  const lista = Array.isArray(json) ? json : json.data ?? [];
  const matriz = lista.find((f: any) => f.nome === 'Matriz') ?? lista[0];
  if (!matriz) throw new Error('Nenhuma filial encontrada na produção.');
  return matriz.id;
}

async function consultarPlaca(placa: string, token: string): Promise<any> {
  const placaLimpa = placa.replace(/[^A-Za-z0-9]/g, '');
  const resp = await fetch(`${BASE_URL}/integracoes/veiculo/${placaLimpa}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) return null;
  return resp.json();
}

async function buscarVeiculoPorPlaca(placa: string, token: string): Promise<any> {
  const resp = await fetch(
    `${BASE_URL}/veiculos?busca=${encodeURIComponent(placa)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!resp.ok) return null;
  const lista: any[] = await resp.json();
  return lista.find((v) => v.placa === placa) ?? null;
}

async function criarVeiculo(payload: any, token: string): Promise<void> {
  const resp = await fetch(`${BASE_URL}/veiculos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const err: any = await resp.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message.join('; ') : (err.message ?? `HTTP ${resp.status}`);
    throw new Error(msg);
  }
}

async function atualizarVeiculo(id: string, payload: any, token: string): Promise<void> {
  const resp = await fetch(`${BASE_URL}/veiculos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const err: any = await resp.json().catch(() => ({}));
    const msg = Array.isArray(err.message) ? err.message.join('; ') : (err.message ?? `HTTP ${resp.status}`);
    throw new Error(msg);
  }
}

async function main() {
  console.log(`Conectando em ${BASE_URL}...`);
  const token = await login();
  console.log('Login OK.');

  const filialId = await getFilialId(token);
  console.log(`Filial Matriz: ${filialId}\n`);

  let criados = 0;
  let atualizados = 0;
  let pulados = 0;
  let erros = 0;
  const hoje = new Date().toISOString();

  for (const placa of PLACAS) {
    try {
      // 1. Consultar dados reais da placa
      const dados = await consultarPlaca(placa, token);

      if (!dados) {
        console.log(`SKIP  ${placa}: falha na consulta`);
        pulados++;
        continue;
      }

      const simulado = dados.simulado === true;
      const label = simulado ? '(simulado)' : `→ ${dados.marca} ${dados.modelo} ${dados.anoModelo}`;

      // 2. Verificar se já existe um veículo com essa placa
      const existente = await buscarVeiculoPorPlaca(placa, token);

      // renavam: usa o real se válido (>=9 chars), senão placeholder para compatibilidade
      const renavamFinal = (dados.renavam && String(dados.renavam).length >= 9)
        ? String(dados.renavam)
        : '000000000';

      if (existente) {
        // Atualizar com dados reais
        const update: any = {
          marca: dados.marca,
          modelo: dados.modelo,
          anoFabricacao: dados.anoFabricacao,
          anoModelo: dados.anoModelo,
          cor: dados.cor,
          combustivel: dados.combustivel ?? 'FLEX',
          renavam: renavamFinal,
          propNome: 'A VERIFICAR',
          propCpfCnpj: '00000000000',
          observacoes: simulado
            ? 'Dados simulados — aguardando consulta real'
            : 'Dados reais via consulta de placa',
        };

        if (!simulado && dados.chassi && dados.chassi.length >= 17) {
          update.chassi = dados.chassi;
        }

        await atualizarVeiculo(existente.id, update, token);
        console.log(`UPD   ${placa} ${label}`);
        atualizados++;
      } else {
        // Criar novo veículo
        const chassi = (!simulado && dados.chassi?.length >= 17)
          ? dados.chassi
          : ('PLAC' + placa.replace(/\s/g, '')).padEnd(17, '0');

        const payload: any = {
          placa,
          chassi,
          renavam: renavamFinal,
          marca: dados.marca,
          modelo: dados.modelo,
          anoFabricacao: dados.anoFabricacao,
          anoModelo: dados.anoModelo,
          cor: dados.cor,
          combustivel: dados.combustivel ?? 'FLEX',
          quilometragem: 0,
          dataEntrada: hoje,
          valorCompra: 1,
          propNome: 'A VERIFICAR',
          propCpfCnpj: '00000000000',
          filialId,
          observacoes: simulado
            ? 'Dados simulados — aguardando consulta real'
            : 'Dados reais via consulta de placa',
        };

        await criarVeiculo(payload, token);
        console.log(`NEW   ${placa} ${label}`);
        criados++;
      }
    } catch (e: any) {
      console.error(`ERRO  ${placa}: ${e.message}`);
      erros++;
    }
  }

  console.log(`\nResumo: ${criados} criados, ${atualizados} atualizados, ${pulados} pulados, ${erros} com erro.`);
}

main().catch(console.error);
