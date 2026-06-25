'use strict';
/**
 * Busca todos os veículos com marca "A VERIFICAR" e tenta atualizar
 * os dados via ConsultarPlaca API.
 *
 * Executar dentro do container:
 *   docker compose exec -T backend node /app/prisma/atualizar-dados-placas.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const API_URL = process.env.CONSULTARPLACA_API_URL || 'https://api.consultarplaca.com.br/v2';
const EMAIL   = process.env.CONSULTARPLACA_EMAIL   || '';
const APIKEY  = process.env.CONSULTARPLACA_APIKEY  || '';
const AUTH    = 'Basic ' + Buffer.from(`${EMAIL}:${APIKEY}`).toString('base64');

function mapCombustivel(valor) {
  if (!valor) return null;
  const v = valor.toUpperCase();
  if (v.includes('DIESEL'))                          return 'DIESEL';
  if (v.includes('ELÉTR') || v.includes('ELETR'))   return 'ELETRICO';
  if (v.includes('HÍBR')  || v.includes('HIBR'))    return 'HIBRIDO';
  if (v.includes('GASOL') && !v.includes('FLEX') && !v.includes('ALCOOL')) return 'GASOLINA';
  return 'FLEX';
}

async function consultarPlaca(placa) {
  const p = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  try {
    const resp = await fetch(`${API_URL}/consultarPlaca?placa=${p}`, {
      headers: { Authorization: AUTH, Accept: 'application/json' },
    });
    const json = await resp.json().catch(() => null);
    console.log(`   [API raw] status=${json?.status} placa=${p}`);
    if (!json || json.status !== 'ok') return null;
    const d = json?.dados?.informacoes_veiculo?.dados_veiculo ?? {};
    return {
      marca:         (d.marca ?? '').split('/')[0].trim() || null,
      modelo:        d.modelo        || null,
      anoFabricacao: Number(d.ano_fabricacao) || null,
      anoModelo:     Number(d.ano_modelo)     || null,
      cor:           d.cor           || null,
      chassi:        (d.chassi ?? '').toUpperCase() || null,
      renavam:       d.renavam ? String(d.renavam) : null,
      combustivel:   mapCombustivel(d.combustivel),
    };
  } catch (e) {
    console.log(`   [API err] ${e.message}`);
    return null;
  }
}

async function main() {
  // Veículos que ainda têm dados placeholder
  const veiculos = await prisma.veiculo.findMany({
    where: { marca: 'A VERIFICAR' },
    select: { id: true, placa: true, chassi: true },
  });

  console.log(`Encontrados ${veiculos.length} veículo(s) com marca "A VERIFICAR".\n`);

  if (!EMAIL || !APIKEY) {
    console.error('ERRO: CONSULTARPLACA_EMAIL / CONSULTARPLACA_APIKEY não definidos no ambiente!');
    return;
  }

  let atualizados = 0, semDados = 0, erros = 0;

  for (const v of veiculos) {
    console.log(`Consultando ${v.placa}...`);
    const dados = await consultarPlaca(v.placa);

    if (!dados || !dados.marca) {
      console.log(`   → sem dados reais. Pulando.\n`);
      semDados++;
      continue;
    }

    // Monta update (só campos não-nulos)
    const update = {
      marca:  dados.marca,
      modelo: dados.modelo  ?? 'A VERIFICAR',
      cor:    dados.cor     ?? 'A VERIFICAR',
      observacoes: 'Dados reais via ConsultarPlaca',
    };
    if (dados.anoFabricacao) update.anoFabricacao = dados.anoFabricacao;
    if (dados.anoModelo)     update.anoModelo     = dados.anoModelo;
    if (dados.combustivel)   update.combustivel   = dados.combustivel;
    if (dados.renavam)       update.renavam       = dados.renavam;
    if (dados.chassi && dados.chassi.length >= 17 && v.chassi.startsWith('PLAC')) {
      update.chassi = dados.chassi;
    }

    try {
      await prisma.veiculo.update({ where: { id: v.id }, data: update });
      console.log(`   → ATUALIZADO: ${dados.marca} ${dados.modelo} ${dados.anoModelo ?? ''}\n`);
      atualizados++;
    } catch (e) {
      console.error(`   → ERRO ao salvar: ${e.message}\n`);
      erros++;
    }
  }

  console.log(`\nResumo: ${atualizados} atualizados, ${semDados} sem dados da API, ${erros} com erro.`);

  if (semDados > 0) {
    console.log('\nOs veículos sem dados podem indicar:');
    console.log(' - Créditos insuficientes na conta ConsultarPlaca');
    console.log(' - Placas não encontradas na base');
    console.log(` - Credenciais: EMAIL=${EMAIL ? EMAIL : '(não definido)'}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
