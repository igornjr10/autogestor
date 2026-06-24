import { PrismaClient, Combustivel } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
  const matriz = await prisma.filial.findFirst({ where: { nome: 'Matriz' } });
  if (!matriz) {
    console.warn('Filial "Matriz" não encontrada. Veículos serão cadastrados sem filial.');
  }

  let cadastrados = 0;
  let pulados = 0;
  let erros = 0;

  for (const placa of PLACAS) {
    const placaSemEspaco = placa.replace(/\s/g, '');
    const chassi = ('PLAC' + placaSemEspaco).padEnd(17, '0');

    const existente = await prisma.veiculo.findFirst({ where: { placa } });
    if (existente) {
      console.log(`⚠  Placa ${placa} já existe no banco. Pulando.`);
      pulados++;
      continue;
    }

    try {
      await prisma.veiculo.create({
        data: {
          placa,
          chassi,
          marca: 'A VERIFICAR',
          modelo: 'A VERIFICAR',
          anoFabricacao: 2020,
          anoModelo: 2020,
          cor: 'A VERIFICAR',
          combustivel: Combustivel.FLEX,
          quilometragem: 0,
          dataEntrada: new Date(),
          valorCompra: 1,
          observacoes: 'Cadastrado via automação – dados a completar',
          filialId: matriz?.id ?? null,
        },
      });
      console.log(`OK  ${placa}`);
      cadastrados++;
    } catch (e: any) {
      console.error(`ERRO ${placa}: ${e.message}`);
      erros++;
    }
  }

  console.log(`\nResumo: ${cadastrados} cadastradas, ${pulados} já existiam, ${erros} com erro.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
