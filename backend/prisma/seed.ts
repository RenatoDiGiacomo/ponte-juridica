import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding banco de dados...');

  // Planos
  const planos = await Promise.all([
    prisma.plano.upsert({ where: { id: 1 }, update: {}, create: { nome: 'Básico', valorMensal: 99.00, valorAnual: 830.00 } }),
    prisma.plano.upsert({ where: { id: 2 }, update: {}, create: { nome: 'Profissional', valorMensal: 199.00, valorAnual: 1430.00 } }),
    prisma.plano.upsert({ where: { id: 3 }, update: {}, create: { nome: 'Elite', valorMensal: 399.00, valorAnual: 2400.00 } }),
  ]);
  console.log(`✓ ${planos.length} planos criados`);

  // Advogado demo
  const senhaDemo = await bcrypt.hash('senha123', 10);
  const adv = await prisma.advogado.upsert({
    where: { email: 'maria.demo@pontejuridica.com' },
    update: {},
    create: {
      nome: 'Dra. Maria Ferreira (Demo)',
      email: 'maria.demo@pontejuridica.com',
      senha: senhaDemo,
      especializacao: 'Trabalhista',
      oab: '00001/SP',
      planoId: 2,
    },
  });
  console.log(`✓ Advogado demo: ${adv.email}`);

  // Cliente demo
  const cliente = await prisma.cliente.upsert({
    where: { email: 'cliente.demo@pontejuridica.com' },
    update: {},
    create: {
      nome: 'João Silva (Demo)',
      email: 'cliente.demo@pontejuridica.com',
      senha: senhaDemo,
      documento: '000.000.000-00',
    },
  });
  console.log(`✓ Cliente demo: ${cliente.email}`);
  console.log('\nSenha de todos os usuários demo: senha123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
