import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding banco de dados...');

  const planos = await Promise.all([
    prisma.plano.upsert({ where: { id: 1 }, update: {}, create: { nome: 'Básico', valorMensal: 99.00, valorAnual: 830.00 } }),
    prisma.plano.upsert({ where: { id: 2 }, update: {}, create: { nome: 'Profissional', valorMensal: 199.00, valorAnual: 1430.00 } }),
    prisma.plano.upsert({ where: { id: 3 }, update: {}, create: { nome: 'Elite', valorMensal: 399.00, valorAnual: 2400.00 } }),
  ]);
  console.log(`✓ ${planos.length} planos criados`);

  const senhaDemo = await bcrypt.hash('senha123', 10);

  const advogados = [
    { nome: 'Dra. Maria Ferreira', email: 'maria.demo@pontejuridica.com', oab: '00001/SP', especializacao: 'Trabalhista', planoId: 2 },
    { nome: 'Dr. Carlos Mendes', email: 'carlos@pontejuridica.com', oab: '00002/SP', especializacao: 'Criminal', planoId: 3 },
    { nome: 'Dra. Ana Paula Lima', email: 'ana@pontejuridica.com', oab: '00003/RJ', especializacao: 'Família', planoId: 2 },
    { nome: 'Dr. Roberto Alves', email: 'roberto@pontejuridica.com', oab: '00004/MG', especializacao: 'Tributário', planoId: 3 },
    { nome: 'Dra. Juliana Costa', email: 'juliana@pontejuridica.com', oab: '00005/SP', especializacao: 'Cível', planoId: 1 },
    { nome: 'Dr. Felipe Santos', email: 'felipe@pontejuridica.com', oab: '00006/RS', especializacao: 'Previdenciário', planoId: 2 },
    { nome: 'Dra. Luciana Prado', email: 'luciana@pontejuridica.com', oab: '00007/SP', especializacao: 'Trabalhista', planoId: 3 },
    { nome: 'Dr. Marcos Oliveira', email: 'marcos@pontejuridica.com', oab: '00008/BA', especializacao: 'Criminal', planoId: 1 },
  ];

  for (const adv of advogados) {
    await prisma.advogado.upsert({
      where: { email: adv.email },
      update: {},
      create: { ...adv, senha: senhaDemo },
    });
  }
  console.log(`✓ ${advogados.length} advogados criados`);

  const cliente = await prisma.cliente.upsert({
    where: { email: 'cliente.demo@pontejuridica.com' },
    update: {},
    create: { nome: 'João Silva', email: 'cliente.demo@pontejuridica.com', senha: senhaDemo, documento: '000.000.000-00' },
  });
  console.log(`✓ Cliente demo: ${cliente.email}`);
  console.log('\nSenha de todos os usuários demo: senha123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
