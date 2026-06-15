import 'dotenv/config';
import { Cliente, PrismaClient } from '@prisma/client';
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
    { nome: 'Dra. Maria Ferreira', email: 'maria.demo@pontejuridica.com', oab: '00001/SP', area: 'Trabalhista', planoId: 2, nota: 4.8, estadoAtuacao: 'SP', cidadeAtuacao: 'São Paulo', telefone: '(11) 3000-0001', whatsapp: '(11) 99000-0001' },
    { nome: 'Dr. Carlos Mendes', email: 'carlos@pontejuridica.com', oab: '00002/SP', area: 'Criminal', planoId: 3, nota: 4.5, estadoAtuacao: 'SP', cidadeAtuacao: 'Campinas', telefone: '(19) 3000-0002', whatsapp: '(19) 99000-0002' },
    { nome: 'Dra. Ana Paula Lima', email: 'ana@pontejuridica.com', oab: '00003/RJ', area: 'Família', planoId: 2, nota: 4.9, estadoAtuacao: 'RJ', cidadeAtuacao: 'Rio de Janeiro', telefone: '(21) 3000-0003', whatsapp: '(21) 99000-0003' },
    { nome: 'Dr. Roberto Alves', email: 'roberto@pontejuridica.com', oab: '00004/MG', area: 'Tributário', planoId: 3, nota: 4.2, estadoAtuacao: 'MG', cidadeAtuacao: 'Belo Horizonte', telefone: '(31) 3000-0004', whatsapp: '(31) 99000-0004' },
    { nome: 'Dra. Juliana Costa', email: 'juliana@pontejuridica.com', oab: '00005/SP', area: 'Cível', planoId: 1, nota: 3.9, estadoAtuacao: 'SP', cidadeAtuacao: 'Santos', telefone: '(13) 3000-0005', whatsapp: '(13) 99000-0005' },
    { nome: 'Dr. Felipe Santos', email: 'felipe@pontejuridica.com', oab: '00006/RS', area: 'Previdenciário', planoId: 2, nota: 4.8, estadoAtuacao: 'RS', cidadeAtuacao: 'Porto Alegre', telefone: '(51) 3000-0006', whatsapp: '(51) 99000-0006' },
    { nome: 'Dra. Luciana Prado', email: 'luciana@pontejuridica.com', oab: '00007/SP', area: 'Trabalhista', planoId: 3, nota: 4.6, estadoAtuacao: 'SP', cidadeAtuacao: 'São Paulo', telefone: '(11) 3000-0007', whatsapp: '(11) 99000-0007' },
    { nome: 'Dr. Marcos Oliveira', email: 'marcos@pontejuridica.com', oab: '00008/BA', area: 'Criminal', planoId: 1, nota: 4.1, estadoAtuacao: 'BA', cidadeAtuacao: 'Salvador', telefone: '(71) 3000-0008', whatsapp: '(71) 99000-0008' },
  ];

  for (const adv of advogados) {
    const { area: _area, ...dadosAdv } = adv; // `area` é só p/ o mapeamento N:N, não é coluna
    await prisma.advogado.upsert({
      where: { email: adv.email },
      // atualiza os campos ricos também em advogados já seedados (idempotente)
      update: {
        nota: adv.nota,
        estadoAtuacao: adv.estadoAtuacao,
        cidadeAtuacao: adv.cidadeAtuacao,
        telefone: adv.telefone,
        whatsapp: adv.whatsapp,
      },
      create: { ...dadosAdv, senha: senhaDemo },
    });
  }
  console.log(`✓ ${advogados.length} advogados criados`);

  // Áreas de atuação (lista controlada) + mapeamento especializacao -> AdvogadoArea (N:N)
  const AREAS = ['Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];
  const areas = await Promise.all(
    AREAS.map((nome) =>
      prisma.area.upsert({ where: { nome }, update: {}, create: { nome } }),
    ),
  );
  const areaPorNome = new Map(areas.map((a) => [a.nome, a.id]));
  console.log(`✓ ${areas.length} áreas criadas`);

  // Mapas de apoio: email -> id (DB) e email -> área (definida localmente no array acima).
  const advsDb = await prisma.advogado.findMany({ where: { softDelete: false }, select: { id: true, email: true } });
  const idPorEmail = new Map(advsDb.map((a) => [a.email, a.id]));
  const areaPorEmail = new Map(advogados.map((a) => [a.email, a.area]));

  async function vincularArea(email: string, nomeArea: string) {
    const advId = idPorEmail.get(email);
    const areaId = areaPorNome.get(nomeArea);
    if (!advId || !areaId) return false;
    await prisma.advogadoArea.upsert({
      where: { advogadoId_areaId: { advogadoId: advId, areaId } },
      update: {},
      create: { advogadoId: advId, areaId },
    });
    return true;
  }

  // Área principal de cada advogado (idempotente).
  let vinculos = 0;
  for (const adv of advogados) {
    if (await vincularArea(adv.email, adv.area)) vinculos++;
  }

  // Alguns advogados atuam em mais de uma área (demonstra o N:N e os filtros multi-área).
  const segundaArea: Record<string, string> = {
    'maria.demo@pontejuridica.com': 'Previdenciário', // Trabalhista + Previdenciário
    'felipe@pontejuridica.com': 'Trabalhista',        // Previdenciário + Trabalhista
    'carlos@pontejuridica.com': 'Cível',              // Criminal + Cível
  };
  for (const [email, nomeArea] of Object.entries(segundaArea)) {
    if (await vincularArea(email, nomeArea)) vinculos++;
  }
  console.log(`✓ ${vinculos} vínculos advogado-área criados`);

  const clientesDemo = [
    { nome: 'João Silva', email: 'cliente.demo@pontejuridica.com', documento: '000.000.000-00' },
    { nome: 'Mariana Souza', email: 'mariana@pontejuridica.com', documento: '111.111.111-11' },
    { nome: 'Pedro Henrique', email: 'pedro@pontejuridica.com', documento: '222.222.222-22' },
  ];
  const clientes: Cliente[] = [];
  for (const c of clientesDemo) {
    clientes.push(
      await prisma.cliente.upsert({
        where: { email: c.email },
        update: {},
        create: { ...c, senha: senhaDemo },
      }),
    );
  }
  console.log(`✓ ${clientes.length} clientes criados`);

  const todosAdvogados = await prisma.advogado.findMany({
    where: { softDelete: false },
    select: { id: true, nome: true, email: true },
  });

  const processosDemo = [
    {
      cliente: clientes[0],
      titulo: 'Rescisão indireta — atraso de salário há 4 meses',
      descricao:
        'Trabalho há 3 anos numa empresa de logística que está atrasando salários há 4 meses consecutivos. Tenho holerites e prints das mensagens do RH. Quero saber se cabe rescisão indireta com pedido de tutela de urgência.',
      especializacao: 'Trabalhista',
      estado: 'SP',
      cidade: 'São Paulo',
    },
    {
      cliente: clientes[1],
      titulo: 'Divórcio consensual com partilha de imóvel',
      descricao:
        'Casamento de 8 anos, sem filhos, com um imóvel financiado em conjunto e um carro. Já temos acordo verbal sobre a divisão. Procuro orientação para formalizar o divórcio consensual.',
      especializacao: 'Família',
      estado: 'RJ',
      cidade: 'Rio de Janeiro',
    },
    {
      cliente: clientes[2],
      titulo: 'Defesa em processo criminal — furto qualificado',
      descricao:
        'Familiar foi indiciado em inquérito por furto qualificado. Preciso de defesa técnica para a fase de instrução. Audiência marcada para o próximo mês.',
      especializacao: 'Criminal',
      estado: 'BA',
      cidade: 'Salvador',
    },
    {
      cliente: clientes[0],
      titulo: 'Revisão de aposentadoria por tempo de contribuição',
      descricao:
        'Aposentei em 2019 mas acredito que houve erro no cálculo do INSS. Tenho CNIS completo e carta de concessão. Quero analisar se cabe revisão.',
      especializacao: 'Previdenciário',
      estado: 'RS',
      cidade: 'Porto Alegre',
    },
    {
      cliente: clientes[1],
      titulo: 'Cobrança indevida de tarifa bancária',
      descricao:
        'Banco vem cobrando tarifa de pacote de serviços que cancelei há mais de um ano. Já tentei resolver pelo SAC sem sucesso. Pretendo ação de repetição de indébito + danos morais.',
      especializacao: 'Cível',
      estado: 'SP',
      cidade: 'Santos',
    },
  ];

  for (const p of processosDemo) {
    const existente = await prisma.processo.findFirst({
      where: { titulo: p.titulo, clienteId: p.cliente.id },
    });
    if (existente) {
      // backfill da região em processos já seedados (idempotente)
      if (!existente.estado) {
        await prisma.processo.update({
          where: { id: existente.id },
          data: { estado: p.estado, cidade: p.cidade },
        });
      }
      continue;
    }

    const processo = await prisma.processo.create({
      data: {
        clienteId: p.cliente.id,
        titulo: p.titulo,
        descricao: p.descricao,
        especializacao: p.especializacao,
        estado: p.estado,
        cidade: p.cidade,
      },
    });

    // gera 1-2 propostas por processo (do(s) advogado(s) da área do caso)
    const candidatos = todosAdvogados.filter((a) => areaPorEmail.get(a.email) === p.especializacao);
    for (const adv of candidatos.slice(0, 2)) {
      await prisma.proposta.create({
        data: {
          processoId: processo.id,
          advogadoId: adv.id,
          mensagem: `Olá, sou ${adv.nome}. Tenho experiência em casos de ${p.especializacao.toLowerCase()} e posso te atender. Vamos conversar?`,
          valorEstimado: 1500 + Math.floor(Math.random() * 2000),
        },
      });
    }
  }
  console.log(`✓ ${processosDemo.length} processos demo + propostas criados`);

  // Marca o primeiro processo como "em atendimento" com proposta aceita +
  // cria vínculo correspondente — para mostrar o estado pós-aceite na demo.
  const primeiro = await prisma.processo.findFirst({
    where: { titulo: processosDemo[0].titulo, softDelete: false },
    include: { propostas: { where: { softDelete: false }, orderBy: { id: 'asc' } } },
  });
  if (primeiro && primeiro.status === 'aberto' && primeiro.propostas.length > 0) {
    const aceita = primeiro.propostas[0];
    await prisma.proposta.update({
      where: { id: aceita.id },
      data: { status: 'aceita' },
    });
    if (primeiro.propostas[1]) {
      await prisma.proposta.update({
        where: { id: primeiro.propostas[1].id },
        data: { status: 'recusada' },
      });
    }
    await prisma.processo.update({
      where: { id: primeiro.id },
      data: { status: 'em_atendimento' },
    });
    const vinc = await prisma.clienteAdvogado.findFirst({
      where: {
        clienteId: primeiro.clienteId,
        advogadoId: aceita.advogadoId,
        softDelete: false,
      },
    });
    if (!vinc) {
      await prisma.clienteAdvogado.create({
        data: { clienteId: primeiro.clienteId, advogadoId: aceita.advogadoId },
      });
    }
    console.log(`✓ Caso "${primeiro.titulo}" marcado como em_atendimento (demo)`);
  }

  console.log('\nSenha de todos os usuários demo: senha123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
