/**
 * Limpa os 30 veículos placeholder (chassi PLAC...) e recria com dados
 * reais da ConsultarPlaca API.
 *
 * Executar no VPS: ts-node prisma/limpar-e-recriar-placas.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, Combustivel } from '@prisma/client';

const prisma = new PrismaClient();

const CONSULTARPLACA_API_URL = process.env.CONSULTARPLACA_API_URL ?? 'https://api.consultarplaca.com.br/v2';
const CONSULTARPLACA_EMAIL   = process.env.CONSULTARPLACA_EMAIL ?? '';
const CONSULTARPLACA_APIKEY  = process.env.CONSULTARPLACA_APIKEY ?? '';
const AUTH = 'Basic ' + Buffer.from(`${CONSULTARPLACA_EMAIL}:${CONSULTARPLACA_APIKEY}`).toString('base64');

const PLACAS = [
  'PTM 4B84', 'RQD 8E28', 'PSH 5R87', 'ROF 3J46', 'RWZ 8E80',
  'ROF 3I12', 'DFM 0H41', 'RWV 1A41', 'ROJ 5J06', 'QVQ 8G51',
  'PTC 8F69', 'PSK 0275', 'TVS 1A65', 'TUC 5856', 'QWB 0J89',
  'ROL 2F36', 'PTE 7C61', 'SBL 4J71', 'ROG 7C83', 'ROP 5G71',
  'PLM 357',  'ROK 5B30', 'SNJ 6E12', 'SZQ 7B82', 'PSS 1280',
  'ROG 5C79', 'QEH 3D61', 'QVU 5J65', 'PTP 3E58', 'RQU 3J19',
];

function mapCombustivel(valor?: string): Combustivel {
  if (!valor) return Combustivel.FLEX;
  const v = valor.toUpperCase();
  if (v.includes('DIESEL')) return Combustivel.DIESEL;
  if (v.includes('ELÉTR') || v.includes('ELETR')) return Combustivel.ELETRICO;
  if (v.includes('HÍBR')  || v.includes('HIBR'))  return Combustivel.HIBRIDO;
  if (v.includes('GASOL') && !v.includes('ALCOOL') && !v.includes('ÁLCOOL') && !v.includes('FLEX'))
    return Combustivel.GASOLINA;
  return Combustivel.FLEX;
}

async function consultarPlaca(placa: string) {
  const p = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  try {
    const resp = await fetch(`${CONSULTARPLACA_API_URL}/consultarPlaca?placa=${p}`, {
      headers: { Authorization: AUTH, Accept: 'application/json' },
    });
    if (!resp.ok) return null;
    const json: any = await resp.json().catch(() => null);
    if (!json || json?.status !== 'ok') return null;
    const d = json?.dados?.informacoes_veiculo?.dados_veiculo ?? {};
    return {
      marca:          (d.marca ?? '').split('/')[0].trim() || 'A VERIFICAR',
      modelo:         d.modelo ?? 'A VERIFICAR',
      anoFabricacao:  Number(d.ano_fabricacao) || 2020,
      anoModelo:      Number(d.ano_modelo)     || 2020,
      cor:            d.cor ?? 'A VERIFICAR',
      chassi:         (d.chassi ?? '').toUpperCase(),
      renavam:        d.renavam ? String(d.renavam) : null,
      combustivel:    mapCombustivel(d.combustivel),
      simulado:       false,
    };
  } catch {
    return null;
  }
}

async function main() {
  // 1. Apaga todos os veículos com chassi PLAC...
  const deletados = await prisma.veiculo.deleteMany({
    where: { chassi: { startsWith: 'PLAC' } },
  });
  console.log(`Deletados ${deletados.count} veículos placeholder.`);

  const matriz = await prisma.filial.findFirst({ where: { nome: 'Matriz' } });
  const filialId = matriz?.id ?? null;

  let criados = 0;
  let erros   = 0;
  const hoje  = new Date();

  for (const placa of PLACAS) {
    const p = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    const dados = await consultarPlaca(placa);

    // Escolhe chassi real ou placeholder único
    const usarChassiReal = dados && !dados.simulado && dados.chassi.length >= 17;
    const chassi = usarChassiReal
      ? dados!.chassi
      : ('PLAC' + p).padEnd(17, '0');

    // Verifica se chassis já existe (edge case de consulta duplicada)
    const existente = await prisma.veiculo.findUnique({ where: { chassi } });
    if (existente) {
      console.log(`SKIP  ${placa}: chassi já existe`);
      continue;
    }

    try {
      await prisma.veiculo.create({
        data: {
          placa,
          chassi,
          marca:         dados?.marca         ?? 'A VERIFICAR',
          modelo:        dados?.modelo        ?? 'A VERIFICAR',
          anoFabricacao: dados?.anoFabricacao  ?? 2020,
          anoModelo:     dados?.anoModelo      ?? 2020,
          cor:           dados?.cor            ?? 'A VERIFICAR',
          combustivel:   dados?.combustivel    ?? Combustivel.FLEX,
          quilometragem: 0,
          dataEntrada:   hoje,
          valorCompra:   1,
          renavam:       dados?.renavam        ?? null,
          observacoes:   dados && !dados.simulado
            ? 'Dados reais via ConsultarPlaca'
            : 'Dados a completar',
          filialId,
        },
      });
      const src = dados && !dados.simulado ? 'REAL' : 'PLAC';
      console.log(`${src}  ${placa} → ${dados?.marca ?? ''} ${dados?.modelo ?? ''}`);
      criados++;
    } catch (e: any) {
      console.error(`ERRO  ${placa}: ${e.message}`);
      erros++;
    }
  }

  console.log(`\nCriados: ${criados}  Erros: ${erros}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
