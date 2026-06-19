import { PrismaClient, Perfil } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Garante a filial Matriz (multi-filial / Fase 2)
  let matriz = await prisma.filial.findFirst({ where: { nome: 'Matriz' } });
  if (!matriz) {
    matriz = await prisma.filial.create({ data: { nome: 'Matriz' } });
    console.log('Filial "Matriz" criada.');
  }

  // 2. Backfill: associa dados existentes sem filial à Matriz
  const [v, vd, l] = await Promise.all([
    prisma.veiculo.updateMany({ where: { filialId: null }, data: { filialId: matriz.id } }),
    prisma.venda.updateMany({ where: { filialId: null }, data: { filialId: matriz.id } }),
    prisma.lancamento.updateMany({ where: { filialId: null }, data: { filialId: matriz.id } }),
  ]);
  if (v.count || vd.count || l.count) {
    console.log(`Backfill → veículos: ${v.count}, vendas: ${vd.count}, lançamentos: ${l.count}`);
  }

  // 3. Usuário admin (global — filialId nulo, acessa todas as filiais)
  const email = 'admin@gestao.com';
  const senhaPadrao = 'admin123';
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    console.log(`Usuário admin já existe (${email}). Nada a fazer.`);
    return;
  }

  const senhaHash = await bcrypt.hash(senhaPadrao, 10);
  await prisma.usuario.create({
    data: { nome: 'Administrador', email, senhaHash, perfil: Perfil.ADMIN },
  });
  console.log(`Usuário admin criado: ${email} / ${senhaPadrao}`);
  console.log('IMPORTANTE: troque essa senha após o primeiro login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
