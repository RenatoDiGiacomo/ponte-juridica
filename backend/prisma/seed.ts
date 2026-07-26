import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de aleatoriedade (seed roda em Node; Math.random é aceitável aqui)
// ─────────────────────────────────────────────────────────────────────────────
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)];
const chance = (p: number) => Math.random() < p;
function pickN<T>(arr: readonly T[], n: number): T[] {
  const copia = [...arr];
  const out: T[] = [];
  while (out.length < n && copia.length) out.push(copia.splice(randInt(0, copia.length - 1), 1)[0]);
  return out;
}
const diasAtras = (d: number) => new Date(Date.now() - d * 86_400_000);

// ─────────────────────────────────────────────────────────────────────────────
// Pools de dados fictícios (acentuação correta)
// ─────────────────────────────────────────────────────────────────────────────
const AREAS = ['Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'] as const;

const CIDADES_POR_UF: Record<string, string[]> = {
  SP: ['São Paulo', 'Campinas', 'Santos', 'Guarulhos', 'Osasco', 'Ribeirão Preto', 'Sorocaba'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Nova Iguaçu', 'Duque de Caxias', 'Petrópolis'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari'],
  PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau', 'Chapecó'],
  DF: ['Brasília'],
  PE: ['Recife', 'Olinda', 'Caruaru', 'Jaboatão dos Guararapes'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte'],
};
const UFS = Object.keys(CIDADES_POR_UF);
const cidadeDaUf = (uf: string) => pick(CIDADES_POR_UF[uf]);

const PRIMEIROS_M = ['Carlos', 'Roberto', 'Felipe', 'Marcos', 'Rafael', 'Bruno', 'Thiago', 'Rodrigo', 'André', 'Gustavo', 'Ricardo', 'Fernando', 'Eduardo', 'Paulo', 'Lucas', 'Vinícius', 'Daniel', 'Marcelo'];
const PRIMEIROS_F = ['Maria', 'Ana', 'Juliana', 'Luciana', 'Fernanda', 'Patrícia', 'Camila', 'Beatriz', 'Larissa', 'Renata', 'Cláudia', 'Adriana', 'Débora', 'Vanessa', 'Aline', 'Priscila', 'Carolina', 'Mariana'];
const SOBRENOMES = ['Silva', 'Souza', 'Oliveira', 'Ferreira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Mendes', 'Barbosa', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Cavalcanti', 'Moreira', 'Azevedo', 'Cardoso', 'Teixeira'];

// Templates de caso por área (título + descrição, acentuação correta)
const CASOS_POR_AREA: Record<string, { titulo: string; descricao: string }[]> = {
  Trabalhista: [
    { titulo: 'Rescisão indireta por atraso de salário', descricao: 'Trabalho há alguns anos numa empresa que vem atrasando salários por meses consecutivos. Tenho holerites e mensagens do RH. Quero saber se cabe rescisão indireta com pedido de tutela de urgência.' },
    { titulo: 'Horas extras não pagas e banco de horas irregular', descricao: 'Faço em média duas horas extras por dia que nunca foram quitadas. O banco de horas nunca foi compensado. Tenho registros de ponto e testemunhas.' },
    { titulo: 'Reconhecimento de vínculo empregatício (PJ)', descricao: 'Fui contratado como PJ mas cumpria horário, tinha subordinação e exclusividade. Quero reconhecer o vínculo e receber as verbas rescisórias devidas.' },
    { titulo: 'Assédio moral e demissão discriminatória', descricao: 'Sofri assédio moral reiterado da chefia e fui demitido após reportar. Busco reparação por danos morais e reintegração.' },
    { titulo: 'Acúmulo de função sem adicional', descricao: 'Exerço duas funções distintas desde a saída de um colega, sem qualquer adicional. Quero pleitear o pagamento retroativo do acúmulo de função.' },
  ],
  Família: [
    { titulo: 'Divórcio consensual com partilha de imóvel', descricao: 'Casamento sem filhos, com imóvel financiado em conjunto e um carro. Já temos acordo verbal sobre a divisão. Procuro orientação para formalizar o divórcio consensual.' },
    { titulo: 'Guarda compartilhada e regulamentação de visitas', descricao: 'Estou me separando e temos dois filhos menores. Quero definir guarda compartilhada e um regime de convivência equilibrado.' },
    { titulo: 'Ação de alimentos e revisão de pensão', descricao: 'A pensão fixada há anos não acompanha as despesas atuais das crianças. Preciso de ação revisional de alimentos.' },
    { titulo: 'Reconhecimento e dissolução de união estável', descricao: 'Convivemos por vários anos como companheiros e agora nos separamos. Quero reconhecer a união estável e partilhar os bens adquiridos.' },
    { titulo: 'Inventário e partilha de herança', descricao: 'Meu pai faleceu deixando imóveis e contas bancárias. Somos três herdeiros. Preciso conduzir o inventário e a partilha.' },
  ],
  Criminal: [
    { titulo: 'Defesa em processo por furto qualificado', descricao: 'Familiar foi indiciado em inquérito por furto qualificado. Preciso de defesa técnica para a fase de instrução. Audiência marcada para o próximo mês.' },
    { titulo: 'Pedido de liberdade provisória', descricao: 'Meu irmão está preso preventivamente por acusação que consideramos frágil. Buscamos relaxamento da prisão ou liberdade provisória.' },
    { titulo: 'Defesa em ação por lesão corporal', descricao: 'Respondo a processo por lesão corporal em contexto de legítima defesa. Preciso de assistência para demonstrar a excludente de ilicitude.' },
    { titulo: 'Revisão criminal de condenação', descricao: 'Fui condenado com base em prova que hoje se mostra inconsistente. Quero avaliar cabimento de revisão criminal.' },
    { titulo: 'Acompanhamento em inquérito por estelionato', descricao: 'Fui intimado a prestar depoimento em inquérito por suposto estelionato. Preciso de acompanhamento e orientação desde a fase policial.' },
  ],
  Previdenciário: [
    { titulo: 'Revisão de aposentadoria por tempo de contribuição', descricao: 'Aposentei-me recentemente mas acredito que houve erro no cálculo do INSS. Tenho o CNIS completo e a carta de concessão. Quero analisar se cabe revisão.' },
    { titulo: 'Concessão de auxílio-doença negado', descricao: 'Tive o auxílio-doença indeferido apesar dos laudos médicos que comprovam a incapacidade. Quero recorrer administrativamente ou judicialmente.' },
    { titulo: 'Aposentadoria especial por insalubridade', descricao: 'Trabalhei anos exposto a agentes nocivos e tenho PPP e LTCAT. Busco reconhecimento do tempo especial para aposentadoria.' },
    { titulo: 'Pensão por morte indeferida', descricao: 'Tive a pensão por morte do meu companheiro negada por suposta falta de comprovação de dependência. Tenho documentos que comprovam a união.' },
    { titulo: 'Benefício assistencial (LOAS) ao idoso', descricao: 'Minha mãe idosa, de baixa renda, teve o BPC/LOAS negado. Precisamos reverter o indeferimento.' },
  ],
  Cível: [
    { titulo: 'Cobrança indevida de tarifa bancária', descricao: 'O banco cobra tarifa de pacote que cancelei há mais de um ano. Já tentei resolver pelo SAC sem sucesso. Pretendo ação de repetição de indébito com danos morais.' },
    { titulo: 'Rescisão de contrato e devolução de valores', descricao: 'Contratei um serviço que não foi prestado e a empresa se recusa a devolver os valores pagos. Quero rescindir o contrato e ser ressarcido.' },
    { titulo: 'Ação de despejo por falta de pagamento', descricao: 'Sou locador e o inquilino está inadimplente há vários meses. Preciso da ação de despejo cumulada com cobrança dos aluguéis.' },
    { titulo: 'Indenização por negativação indevida', descricao: 'Meu nome foi negativado por dívida já quitada. Sofri restrição de crédito e busco a exclusão do apontamento e indenização.' },
    { titulo: 'Vício em produto e responsabilidade do fornecedor', descricao: 'Comprei um eletrodoméstico que apresentou defeito dentro da garantia e a assistência não resolveu. Quero a troca ou a restituição.' },
  ],
  Tributário: [
    { titulo: 'Repetição de indébito de ICMS na base do PIS/COFINS', descricao: 'Minha empresa recolheu tributos a maior por incluir o ICMS na base do PIS/COFINS. Quero recuperar os valores dos últimos cinco anos.' },
    { titulo: 'Exclusão de multa e juros em execução fiscal', descricao: 'Estou sendo executado por débito tributário com multa e juros que julgo indevidos. Preciso de defesa em embargos à execução.' },
    { titulo: 'Parcelamento e regularização de débitos fiscais', descricao: 'A empresa acumulou débitos federais e quero avaliar o melhor programa de parcelamento para regularizar a situação.' },
    { titulo: 'Restituição de Imposto de Renda retido a maior', descricao: 'Houve retenção de IR a maior sobre verbas de natureza indenizatória. Quero pleitear a restituição do valor.' },
    { titulo: 'Impugnação de auto de infração municipal', descricao: 'Recebi auto de infração de ISS que considero equivocado quanto à base de cálculo. Preciso impugnar administrativamente.' },
  ],
};

const RELATORIOS = [
  'Petição inicial protocolada; aguardando análise do juízo.',
  'Realizada audiência de conciliação; não houve acordo. Processo segue para a fase de instrução.',
  'Juntada de documentos complementares e procuração. Aguardando despacho do magistrado.',
  'Contestação apresentada pela parte contrária; em curso o prazo para réplica.',
  'Sentença publicada favoravelmente ao cliente. Avaliando eventual recurso da parte adversa.',
  'Interposto recurso de apelação; autos remetidos ao tribunal para julgamento.',
  'Cálculos de liquidação apresentados; aguardando homologação pelo juízo.',
  'Acordo homologado em juízo; iniciada a fase de cumprimento de sentença.',
  'Perícia designada; nomeado o perito e apresentados os quesitos das partes.',
  'Expedido alvará de levantamento em favor do cliente.',
];

const ESCRITORIO_SUFIXOS = ['& Associados', 'Advocacia', 'Sociedade de Advogados', 'Advogados Associados', 'Consultoria Jurídica'];
const LOGRADOUROS = ['Av. Paulista', 'Rua XV de Novembro', 'Av. Rio Branco', 'Rua da Consolação', 'Av. Brasil', 'Rua Sete de Setembro', 'Av. Getúlio Vargas', 'Rua Marechal Deodoro'];
const BAIRROS = ['Centro', 'Bela Vista', 'Jardins', 'Savassi', 'Batel', 'Moema', 'Boa Viagem', 'Meireles'];
const BIO_POR_AREA: Record<string, string> = {
  Trabalhista: 'Atuo na defesa dos direitos de trabalhadores e empregadores, com atendimento ágil e transparente.',
  Família: 'Conduzo casos de família com sensibilidade e técnica, buscando sempre a melhor solução para todos os envolvidos.',
  Criminal: 'Defesa criminal técnica e combativa, com acompanhamento próximo em todas as fases do processo.',
  Previdenciário: 'Especialista em benefícios do INSS, revisões e aposentadorias, com foco em resultados concretos.',
  Cível: 'Atuação ampla em Direito Civil — contratos, consumidor e responsabilidade civil — com comunicação clara.',
  Tributário: 'Planejamento e contencioso tributário para empresas e pessoas físicas, reduzindo riscos e custos.',
};

function dadosEscritorio(sobrenome: string, area: string) {
  return {
    escritorio: `${sobrenome} ${pick(ESCRITORIO_SUFIXOS)}`,
    bio: BIO_POR_AREA[area] ?? 'Advogado(a) dedicado(a) ao atendimento próximo e à defesa dos interesses dos clientes.',
    enderecoLogradouro: pick(LOGRADOUROS),
    enderecoNumero: String(randInt(10, 2000)),
    enderecoBairro: pick(BAIRROS),
    enderecoCep: `${randInt(10, 99)}${randInt(100, 999)}-${randInt(100, 999)}`,
  };
}

const MOTIVOS_ENCERRAMENTO = [
  'Acordo cumprido; nada mais a tratar.',
  'Sentença transitada em julgado e valores levantados.',
  'Objeto do caso resolvido extrajudicialmente.',
  'Cliente optou por encerrar a demanda.',
  'Processo arquivado após cumprimento integral.',
];
const JUSTIFICATIVAS_CANCELAMENTO = [
  'Agenda lotada no período; não conseguirei atender com a dedicação necessária.',
  'Identifiquei conflito de interesses neste caso.',
  'A causa foge da minha área de especialização principal.',
  'Não será possível assumir o caso no prazo esperado pelo cliente.',
];

const COMENTARIOS_AVALIACAO = [
  'Excelente atendimento, resolveu meu caso com agilidade.',
  'Profissional muito atencioso e competente. Recomendo!',
  'Conduziu o processo com clareza e me manteve sempre informado.',
  'Ótimo trabalho, superou minhas expectativas.',
  'Bom acompanhamento, fiquei satisfeito com o resultado.',
  'Atendimento cordial e técnico. Voltaria a contratar.',
  'Dedicado e transparente do início ao fim.',
  'Explicou cada etapa em linguagem simples. Muito bom.',
];

const MENSAGENS_PROPOSTA = [
  'Olá! Tenho ampla experiência em casos como o seu e posso conduzir sua demanda com atenção. Podemos conversar sobre os próximos passos?',
  'Analisei seu caso e vejo bons fundamentos. Trabalho com transparência e acompanhamento próximo. Fico à disposição para uma conversa.',
  'Atuo há anos nessa área e já obtive resultados positivos em situações semelhantes. Podemos agendar uma avaliação detalhada.',
  'Seu caso tem elementos importantes a explorar. Ofereço atendimento personalizado e comunicação clara durante todo o processo.',
  'Posso assumir sua causa com dedicação. Explico cada etapa em linguagem simples e mantenho você informado. Vamos alinhar?',
];

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Seeding banco de dados (volume alto)...');

  const planos = await Promise.all([
    prisma.plano.upsert({ where: { id: 1 }, update: {}, create: { nome: 'Básico', valorMensal: 99.0, valorAnual: 830.0 } }),
    prisma.plano.upsert({ where: { id: 2 }, update: {}, create: { nome: 'Profissional', valorMensal: 199.0, valorAnual: 1430.0 } }),
    prisma.plano.upsert({ where: { id: 3 }, update: {}, create: { nome: 'Elite', valorMensal: 399.0, valorAnual: 2400.0 } }),
  ]);
  console.log(`✓ ${planos.length} planos`);

  const areas = await Promise.all(AREAS.map((nome) => prisma.area.upsert({ where: { nome }, update: {}, create: { nome } })));
  const areaPorNome = new Map(areas.map((a) => [a.nome, a.id]));
  console.log(`✓ ${areas.length} áreas`);

  const senhaDemo = await bcrypt.hash('senha123', 10);

  // ── Advogados ────────────────────────────────────────────────────────────
  const TOTAL_ADV = 80;
  const advData: {
    nome: string; email: string; senha: string; oab: string; planoId: number;
    nota: number; estadoAtuacao: string; cidadeAtuacao: string; telefone: string; whatsapp: string;
    escritorio: string; bio: string; enderecoLogradouro: string; enderecoNumero: string;
    enderecoBairro: string; enderecoCep: string;
    areaPrincipal: string; segundaArea?: string;
  }[] = [];

  // Contas demo estáveis (atalhos de login da demonstração) — sempre nos 1ºs lugares.
  advData.push(
    {
      nome: 'Dra. Maria Ferreira', email: 'maria.demo@pontejuridica.com', senha: senhaDemo,
      oab: '00001/SP', planoId: 2, nota: 4.8, estadoAtuacao: 'SP', cidadeAtuacao: 'São Paulo',
      telefone: '(11) 3000-0001', whatsapp: '(11) 99000-0001',
      ...dadosEscritorio('Ferreira', 'Trabalhista'),
      areaPrincipal: 'Trabalhista', segundaArea: 'Previdenciário',
    },
    {
      nome: 'Dr. Carlos Mendes', email: 'carlos.demo@pontejuridica.com', senha: senhaDemo,
      oab: '00002/SP', planoId: 3, nota: 4.5, estadoAtuacao: 'SP', cidadeAtuacao: 'Campinas',
      telefone: '(19) 3000-0002', whatsapp: '(19) 99000-0002',
      ...dadosEscritorio('Mendes', 'Criminal'),
      areaPrincipal: 'Criminal', segundaArea: 'Cível',
    },
    {
      nome: 'Dra. Juliana Costa', email: 'juliana.demo@pontejuridica.com', senha: senhaDemo,
      oab: '00003/SP', planoId: 1, nota: 3.9, estadoAtuacao: 'SP', cidadeAtuacao: 'Santos',
      telefone: '(13) 3000-0003', whatsapp: '(13) 99000-0003',
      ...dadosEscritorio('Costa', 'Cível'),
      areaPrincipal: 'Cível',
    },
  );

  const emailsUsados = new Set(advData.map((a) => a.email));
  for (let i = advData.length; i < TOTAL_ADV; i++) {
    const fem = chance(0.5);
    const primeiro = fem ? pick(PRIMEIROS_F) : pick(PRIMEIROS_M);
    const sobrenome = pick(SOBRENOMES);
    const prefixo = fem ? 'Dra.' : 'Dr.';
    let email = `${primeiro}.${sobrenome}${i}`.toLowerCase().normalize('NFD').replace(/[0300-036f]/g, '') + '@pontejuridica.com';
    while (emailsUsados.has(email)) email = `adv${i}.${Math.random().toString(36).slice(2, 6)}@pontejuridica.com`;
    emailsUsados.add(email);
    const uf = pick(UFS);
    const areaPrincipal = pick(AREAS);
    const segunda = chance(0.35) ? pick(AREAS.filter((a) => a !== areaPrincipal)) : undefined;
    advData.push({
      nome: `${prefixo} ${primeiro} ${sobrenome}`,
      email,
      senha: senhaDemo,
      oab: `${String(i + 1).padStart(5, '0')}/${uf}`,
      planoId: pick([1, 2, 2, 3]), // profissional mais comum
      nota: Math.round((3.4 + Math.random() * 1.6) * 10) / 10,
      estadoAtuacao: uf,
      cidadeAtuacao: cidadeDaUf(uf),
      telefone: `(${randInt(11, 89)}) 3${randInt(100, 999)}-${randInt(1000, 9999)}`,
      whatsapp: `(${randInt(11, 89)}) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
      ...dadosEscritorio(sobrenome, areaPrincipal),
      areaPrincipal,
      segundaArea: segunda,
    });
  }

  await prisma.advogado.createMany({
    data: advData.map(({ areaPrincipal: _a, segundaArea: _s, ...adv }) => adv),
    skipDuplicates: true,
  });
  const advsDb = await prisma.advogado.findMany({ where: { softDelete: false }, select: { id: true, email: true } });
  const advIdPorEmail = new Map(advsDb.map((a) => [a.email, a.id]));
  console.log(`✓ ${advsDb.length} advogados`);

  // Áreas de atuação (N:N)
  const vinculosArea: { advogadoId: number; areaId: number }[] = [];
  for (const adv of advData) {
    const id = advIdPorEmail.get(adv.email);
    if (!id) continue;
    vinculosArea.push({ advogadoId: id, areaId: areaPorNome.get(adv.areaPrincipal)! });
    if (adv.segundaArea) vinculosArea.push({ advogadoId: id, areaId: areaPorNome.get(adv.segundaArea)! });
  }
  await prisma.advogadoArea.createMany({ data: vinculosArea, skipDuplicates: true });
  console.log(`✓ ${vinculosArea.length} vínculos advogado-área`);

  // Índice: área -> advogados que atuam nela (para gerar propostas coerentes)
  const advPorArea = new Map<string, number[]>(AREAS.map((a) => [a, []]));
  for (const adv of advData) {
    const id = advIdPorEmail.get(adv.email)!;
    advPorArea.get(adv.areaPrincipal)!.push(id);
    if (adv.segundaArea) advPorArea.get(adv.segundaArea)!.push(id);
  }

  // ── Clientes ─────────────────────────────────────────────────────────────
  const TOTAL_CLI = 150;
  const cliData: {
    nome: string; email: string; senha: string; documento: string; telefone: string;
    enderecoCidade: string; enderecoEstado: string; dataCadastro: Date;
  }[] = [];

  cliData.push(
    {
      nome: 'João Silva', email: 'cliente.demo@pontejuridica.com', senha: senhaDemo,
      documento: '000.000.000-00', telefone: '(11) 98888-0000',
      enderecoCidade: 'São Paulo', enderecoEstado: 'SP', dataCadastro: diasAtras(200),
    },
    {
      nome: 'Mariana Souza', email: 'mariana.demo@pontejuridica.com', senha: senhaDemo,
      documento: '111.111.111-11', telefone: '(21) 97777-1111',
      enderecoCidade: 'Rio de Janeiro', enderecoEstado: 'RJ', dataCadastro: diasAtras(180),
    },
  );

  const emailsCli = new Set(cliData.map((c) => c.email));
  for (let i = cliData.length; i < TOTAL_CLI; i++) {
    const fem = chance(0.5);
    const primeiro = fem ? pick(PRIMEIROS_F) : pick(PRIMEIROS_M);
    const sobrenome = `${pick(SOBRENOMES)} ${pick(SOBRENOMES)}`;
    let email = `${primeiro}.${sobrenome.split(' ')[0]}${i}`.toLowerCase().normalize('NFD').replace(/[0300-036f]/g, '') + '@email.com';
    while (emailsCli.has(email)) email = `cliente${i}.${Math.random().toString(36).slice(2, 6)}@email.com`;
    emailsCli.add(email);
    const uf = pick(UFS);
    const pf = chance(0.85);
    cliData.push({
      nome: `${primeiro} ${sobrenome}`,
      email,
      senha: senhaDemo,
      documento: pf
        ? `${randInt(100, 999)}.${randInt(100, 999)}.${randInt(100, 999)}-${randInt(10, 99)}`
        : `${randInt(10, 99)}.${randInt(100, 999)}.${randInt(100, 999)}/0001-${randInt(10, 99)}`,
      telefone: `(${randInt(11, 89)}) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
      enderecoCidade: cidadeDaUf(uf),
      enderecoEstado: uf,
      dataCadastro: diasAtras(randInt(1, 200)),
    });
  }

  await prisma.cliente.createMany({ data: cliData, skipDuplicates: true });
  const clientesDb = await prisma.cliente.findMany({
    where: { softDelete: false },
    select: { id: true, enderecoCidade: true, enderecoEstado: true },
  });
  console.log(`✓ ${clientesDb.length} clientes`);

  // Cria vínculo cliente↔advogado só se ainda não existir (evita duplicidade).
  async function garantirVinculo(clienteId: number, advogadoId: number, dataVinculo: Date) {
    const existe = await prisma.clienteAdvogado.findFirst({ where: { clienteId, advogadoId, softDelete: false } });
    if (existe) return false;
    await prisma.clienteAdvogado.create({ data: { clienteId, advogadoId, dataVinculo } });
    return true;
  }

  // ── Processos + Propostas + Relatórios + Vínculos ──────────────────────────
  const TOTAL_PROC = 400;
  let nProp = 0, nRel = 0, nVinc = 0, nAtend = 0, nEncerr = 0;

  for (let i = 0; i < TOTAL_PROC; i++) {
    const cli = pick(clientesDb);
    const area = pick(AREAS);
    const tpl = pick(CASOS_POR_AREA[area]);
    // região do caso: normalmente a do cliente, às vezes outra
    const uf = chance(0.8) && cli.enderecoEstado ? cli.enderecoEstado : pick(UFS);
    const cidade = chance(0.8) && cli.enderecoCidade && uf === cli.enderecoEstado ? cli.enderecoCidade : cidadeDaUf(uf);
    const dataCriacao = diasAtras(randInt(0, 180));

    const processo = await prisma.processo.create({
      data: {
        clienteId: cli.id,
        titulo: tpl.titulo,
        descricao: tpl.descricao,
        especializacao: area,
        estado: uf,
        cidade,
        dataCriacao,
      },
    });

    // Candidatos: advogados que atuam na área do caso
    const candidatos = advPorArea.get(area) ?? [];
    const qtdProp = candidatos.length ? Math.min(candidatos.length, randInt(0, 6)) : 0;
    const escolhidos = pickN(candidatos, qtdProp);

    // Distribuição de status do caso
    const r = Math.random();
    const alvo: 'aberto' | 'em_atendimento' | 'encerrado' =
      escolhidos.length === 0 ? 'aberto' : r < 0.55 ? 'aberto' : r < 0.85 ? 'em_atendimento' : 'encerrado';

    const propostasCriadas: { id: number; advogadoId: number }[] = [];
    for (const advId of escolhidos) {
      const p = await prisma.proposta.create({
        data: {
          processoId: processo.id,
          advogadoId: advId,
          mensagem: pick(MENSAGENS_PROPOSTA),
          valorEstimado: randInt(80, 240) * 25, // R$ 2.000 – R$ 6.000
          dataCriacao: new Date(dataCriacao.getTime() + randInt(0, 5) * 86_400_000),
        },
      });
      propostasCriadas.push({ id: p.id, advogadoId: advId });
      nProp++;
    }

    // Alguns casos abertos têm 1 proposta cancelada pelo advogado (demonstra o recurso).
    if (alvo === 'aberto' && propostasCriadas.length >= 2 && chance(0.18)) {
      const cancel = propostasCriadas.pop()!;
      await prisma.proposta.update({
        where: { id: cancel.id },
        data: { status: 'cancelada', justificativa: pick(JUSTIFICATIVAS_CANCELAMENTO) },
      });
    }

    if (alvo !== 'aberto' && propostasCriadas.length) {
      const aceita = pick(propostasCriadas);
      await prisma.proposta.update({ where: { id: aceita.id }, data: { status: 'aceita' } });
      await prisma.proposta.updateMany({
        where: { processoId: processo.id, id: { not: aceita.id } },
        data: { status: 'recusada' },
      });
      await prisma.processo.update({
        where: { id: processo.id },
        data: { status: alvo, ...(alvo === 'encerrado' && { motivoEncerramento: pick(MOTIVOS_ENCERRAMENTO) }) },
      });

      // Vínculo cliente ↔ advogado responsável
      if (await garantirVinculo(cli.id, aceita.advogadoId, new Date(dataCriacao.getTime() + 3 * 86_400_000))) nVinc++;

      // Relatórios de situação do responsável
      const qtdRel = alvo === 'encerrado' ? randInt(2, 5) : randInt(1, 3);
      for (let k = 0; k < qtdRel; k++) {
        await prisma.relatorioCaso.create({
          data: {
            processoId: processo.id,
            advogadoId: aceita.advogadoId,
            texto: pick(RELATORIOS),
            dataCriacao: new Date(dataCriacao.getTime() + (5 + k * 7) * 86_400_000),
          },
        });
        nRel++;
      }
      if (alvo === 'em_atendimento') nAtend++; else nEncerr++;
    }
  }

  console.log(`✓ ${TOTAL_PROC} processos (${nAtend} em atendimento, ${nEncerr} encerrados)`);
  console.log(`✓ ${nProp} propostas · ${nVinc} vínculos · ${nRel} relatórios`);

  // ── Showcase das contas demo (garante telas populadas na apresentação) ─────
  const mariaId = advIdPorEmail.get('maria.demo@pontejuridica.com')!;
  const joao = await prisma.cliente.findUnique({ where: { email: 'cliente.demo@pontejuridica.com' }, select: { id: true, enderecoCidade: true, enderecoEstado: true } });
  const joaoId = joao!.id;
  const outrosTrab = (advPorArea.get('Trabalhista') ?? []).filter((x) => x !== mariaId);
  const outrosPrev = (advPorArea.get('Previdenciário') ?? []).filter((x) => x !== mariaId);
  const advFamilia = advPorArea.get('Família') ?? [];
  const advCivel = advPorArea.get('Cível') ?? [];

  // Cria um caso de demonstração com proposta(s) e, se aplicável, aceite + relatórios.
  async function casoShowcase(
    clienteId: number,
    uf: string,
    cidade: string,
    area: string,
    statusAlvo: 'aberto' | 'em_atendimento' | 'encerrado',
    aceitarAdvId: number | null,
    outros: number[],
    cancelarUma = false,
  ) {
    const tpl = pick(CASOS_POR_AREA[area]);
    const dataCriacao = diasAtras(randInt(10, 150));
    const processo = await prisma.processo.create({
      data: { clienteId, titulo: tpl.titulo, descricao: tpl.descricao, especializacao: area, estado: uf, cidade, dataCriacao },
    });
    const proponentes = [...new Set([...(aceitarAdvId ? [aceitarAdvId] : []), ...outros])];
    const props: { id: number; advogadoId: number }[] = [];
    for (const advId of proponentes) {
      const p = await prisma.proposta.create({
        data: {
          processoId: processo.id,
          advogadoId: advId,
          mensagem: pick(MENSAGENS_PROPOSTA),
          valorEstimado: randInt(80, 240) * 25,
          dataCriacao: new Date(dataCriacao.getTime() + randInt(0, 4) * 86_400_000),
        },
      });
      props.push({ id: p.id, advogadoId: advId });
      nProp++;
    }
    // Cancela a última proposta (não a do advogado que será aceito), demonstrando o recurso.
    if (statusAlvo === 'aberto' && cancelarUma && props.length >= 2) {
      await prisma.proposta.update({
        where: { id: props[props.length - 1].id },
        data: { status: 'cancelada', justificativa: pick(JUSTIFICATIVAS_CANCELAMENTO) },
      });
    }
    if (statusAlvo !== 'aberto' && aceitarAdvId) {
      const aceita = props.find((p) => p.advogadoId === aceitarAdvId)!;
      await prisma.proposta.update({ where: { id: aceita.id }, data: { status: 'aceita' } });
      await prisma.proposta.updateMany({ where: { processoId: processo.id, id: { not: aceita.id } }, data: { status: 'recusada' } });
      await prisma.processo.update({
        where: { id: processo.id },
        data: { status: statusAlvo, ...(statusAlvo === 'encerrado' && { motivoEncerramento: pick(MOTIVOS_ENCERRAMENTO) }) },
      });
      if (await garantirVinculo(clienteId, aceitarAdvId, new Date(dataCriacao.getTime() + 3 * 86_400_000))) nVinc++;
      const qtd = statusAlvo === 'encerrado' ? randInt(3, 5) : randInt(2, 3);
      for (let k = 0; k < qtd; k++) {
        await prisma.relatorioCaso.create({
          data: { processoId: processo.id, advogadoId: aceitarAdvId, texto: pick(RELATORIOS), dataCriacao: new Date(dataCriacao.getTime() + (5 + k * 7) * 86_400_000) },
        });
        nRel++;
      }
    }
  }

  const ufJoao = joao!.enderecoEstado ?? 'SP';
  const cidJoao = joao!.enderecoCidade ?? 'São Paulo';
  // Casos do João (cliente demo): Meus Casos com propostas, aceites e 2 contatos distintos.
  await casoShowcase(joaoId, ufJoao, cidJoao, 'Trabalhista', 'em_atendimento', mariaId, pickN(outrosTrab, 2));
  await casoShowcase(joaoId, ufJoao, cidJoao, 'Trabalhista', 'aberto', null, [mariaId, ...pickN(outrosTrab, 2)], true);
  await casoShowcase(joaoId, ufJoao, cidJoao, 'Previdenciário', 'encerrado', mariaId, pickN(outrosPrev, 1));
  await casoShowcase(joaoId, ufJoao, cidJoao, 'Previdenciário', 'aberto', null, [mariaId, ...pickN(outrosPrev, 1)]);
  await casoShowcase(joaoId, ufJoao, cidJoao, 'Família', 'em_atendimento', advFamilia[0] ?? null, pickN(advFamilia.slice(1), 1)); // 2º contato
  await casoShowcase(joaoId, ufJoao, cidJoao, 'Cível', 'aberto', null, pickN(advCivel, 2));

  // Mais clientes para a maria (Meus Clientes / Meus Casos ricos): 6 casos aceitos com outros clientes.
  const outrosClientes = clientesDb.filter((c) => c.id !== joaoId);
  for (const cli of pickN(outrosClientes, 6)) {
    const area = pick(['Trabalhista', 'Previdenciário'] as const);
    const uf = cli.enderecoEstado ?? 'SP';
    const cidade = cli.enderecoCidade ?? 'São Paulo';
    const statusAlvo = chance(0.5) ? 'em_atendimento' : 'encerrado';
    const outros = area === 'Trabalhista' ? pickN(outrosTrab, 1) : pickN(outrosPrev, 1);
    await casoShowcase(cli.id, uf, cidade, area, statusAlvo, mariaId, outros);
  }
  // juliana.demo (Cível/Básico) e carlos.demo (Criminal/Elite): casos aceitos + relatórios.
  const julianaId = advIdPorEmail.get('juliana.demo@pontejuridica.com')!;
  const carlosId = advIdPorEmail.get('carlos.demo@pontejuridica.com')!;
  const outrosCivel = advCivel.filter((x) => x !== julianaId);
  const outrosCriminal = (advPorArea.get('Criminal') ?? []).filter((x) => x !== carlosId);
  for (const cli of pickN(outrosClientes, 4)) {
    await casoShowcase(cli.id, cli.enderecoEstado ?? 'SP', cli.enderecoCidade ?? 'São Paulo', 'Cível', chance(0.5) ? 'em_atendimento' : 'encerrado', julianaId, pickN(outrosCivel, 1));
  }
  for (const cli of pickN(outrosClientes, 4)) {
    await casoShowcase(cli.id, cli.enderecoEstado ?? 'SP', cli.enderecoCidade ?? 'São Paulo', 'Criminal', chance(0.5) ? 'em_atendimento' : 'encerrado', carlosId, pickN(outrosCriminal, 1));
  }

  // mariana.demo (cliente): casos publicados com propostas e contatos.
  const mariana = await prisma.cliente.findUnique({ where: { email: 'mariana.demo@pontejuridica.com' }, select: { id: true, enderecoCidade: true, enderecoEstado: true } });
  const ufMar = mariana!.enderecoEstado ?? 'RJ';
  const cidMar = mariana!.enderecoCidade ?? 'Rio de Janeiro';
  await casoShowcase(mariana!.id, ufMar, cidMar, 'Família', 'em_atendimento', advFamilia[0] ?? null, pickN(advFamilia.slice(1), 1));
  await casoShowcase(mariana!.id, ufMar, cidMar, 'Cível', 'encerrado', julianaId, pickN(outrosCivel, 1));
  await casoShowcase(mariana!.id, ufMar, cidMar, 'Trabalhista', 'aberto', null, pickN(outrosTrab, 2));

  console.log('✓ Showcase das contas demo (maria/carlos/juliana + joão/mariana) criado');

  // ── Avaliações: cliente avalia o advogado em casos ENCERRADOS ──────────────
  const encerrados = await prisma.processo.findMany({
    where: { status: 'encerrado', softDelete: false },
    select: { id: true, clienteId: true, propostas: { where: { status: 'aceita', softDelete: false }, select: { advogadoId: true } } },
  });
  let nAval = 0;
  for (const p of encerrados) {
    const advId = p.propostas[0]?.advogadoId;
    if (!advId || !chance(0.85)) continue; // ~85% dos encerrados são avaliados
    const nota = chance(0.65) ? 5 : chance(0.6) ? 4 : 3;
    try {
      await prisma.avaliacao.create({
        data: { processoId: p.id, clienteId: p.clienteId, advogadoId: advId, nota, comentario: pick(COMENTARIOS_AVALIACAO) },
      });
      nAval++;
    } catch {
      // ignora duplicidade (1 avaliação por caso/cliente)
    }
  }
  // Recalcula a nota dos advogados que receberam avaliações (média real).
  const medias = await prisma.avaliacao.groupBy({ by: ['advogadoId'], where: { softDelete: false }, _avg: { nota: true } });
  for (const m of medias) {
    await prisma.advogado.update({
      where: { id: m.advogadoId },
      data: { nota: m._avg.nota != null ? Math.round(m._avg.nota * 10) / 10 : null },
    });
  }
  console.log(`✓ ${nAval} avaliações (nota dos advogados recalculada)`);

  console.log('\nContas demo (senha: senha123):');
  console.log('  Advogado: maria.demo@pontejuridica.com');
  console.log('  Cliente : cliente.demo@pontejuridica.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
