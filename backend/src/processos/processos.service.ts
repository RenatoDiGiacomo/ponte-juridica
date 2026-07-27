import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { CriarProcessoDto } from './dto/criar-processo.dto';
import { CriarPropostaDto } from './dto/criar-proposta.dto';
import { OportunidadesQueryDto } from './dto/oportunidades-query.dto';
import { paginated } from '../common/dto/pagination-query.dto';

/** Limite de propostas/mês por nome de plano. `null` = ilimitado. */
const LIMITE_PROPOSTAS_POR_PLANO: Record<string, number | null> = {
  'Básico': 5,
  'Profissional': 20,
  'Elite': null,
};

@Injectable()
export class ProcessosService {
  constructor(
    private prisma: PrismaService,
    private notificacoes: NotificacoesService,
  ) {}

  /** Quanto o advogado já usou no mês corrente vs. limite do plano. */
  async quotaMensal(advogadoId: number) {
    const advogado = await this.prisma.advogado.findFirst({
      where: { id: advogadoId, softDelete: false },
      include: { plano: true },
    });
    if (!advogado) throw new NotFoundException('Advogado não encontrado');

    const limite = LIMITE_PROPOSTAS_POR_PLANO[advogado.plano.nome] ?? null;
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const usadas = await this.prisma.proposta.count({
      where: {
        advogadoId,
        softDelete: false,
        status: { not: 'cancelada' }, // proposta cancelada libera a cota
        dataCriacao: { gte: inicioMes },
      },
    });

    return {
      plano: advogado.plano.nome,
      limite,
      usadas,
      restantes: limite === null ? null : Math.max(0, limite - usadas),
    };
  }

  criar(clienteId: number, dto: CriarProcessoDto) {
    return this.prisma.processo.create({
      data: { ...dto, clienteId },
    });
  }

  /** Quantas propostas pendentes o cliente tem em casos abertos. */
  contarPropostasPendentes(clienteId: number) {
    return this.prisma.proposta.count({
      where: {
        status: 'pendente',
        softDelete: false,
        processo: { clienteId, status: 'aberto', softDelete: false },
      },
    });
  }

  meusProcessos(clienteId: number) {
    return this.prisma.processo.findMany({
      where: { clienteId, softDelete: false },
      orderBy: { dataCriacao: 'desc' },
      include: {
        propostas: {
          where: { softDelete: false },
          include: {
            advogado: { select: { id: true, nome: true, oab: true } },
          },
        },
        avaliacoes: {
          where: { clienteId, softDelete: false },
          select: { id: true, nota: true, comentario: true },
        },
      },
    });
  }

  /** Oportunidades (casos abertos) para o advogado — default = suas áreas; filtros tempo/região; paginado. */
  async listarAbertos(advogadoId: number, q: OportunidadesQueryDto) {
    // Default inteligente: áreas em que o advogado atua (N:N).
    const vinculos = await this.prisma.advogadoArea.findMany({
      where: { advogadoId },
      select: { area: { select: { nome: true } } },
    });
    const minhasAreas = vinculos.map((v) => v.area.nome);

    // Faixa de data: dataDe/dataAte (intervalo explícito) tem prioridade sobre postadoDias.
    let dataCriacao: Prisma.DateTimeFilter | undefined;
    if (q.dataDe || q.dataAte) {
      dataCriacao = {};
      if (q.dataDe) dataCriacao.gte = new Date(q.dataDe);
      if (q.dataAte) {
        // inclui o dia inteiro do "até"
        const ate = new Date(q.dataAte);
        ate.setHours(23, 59, 59, 999);
        dataCriacao.lte = ate;
      }
    } else if (q.postadoDias) {
      dataCriacao = { gte: new Date(Date.now() - q.postadoDias * 86_400_000) };
    }

    const estados = q.estados?.length ? q.estados : q.estado ? [q.estado] : [];
    const areasFiltro = q.areas?.length ? q.areas : q.area ? [q.area] : [];

    const where: Prisma.ProcessoWhereInput = {
      softDelete: false,
      status: 'aberto',
      ...(areasFiltro.length
        ? { especializacao: { in: areasFiltro } }
        : minhasAreas.length
          ? { especializacao: { in: minhasAreas } }
          : {}),
      ...(estados.length && { estado: { in: estados } }),
      ...(q.cidade && { cidade: { contains: q.cidade } }),
      ...(dataCriacao && { dataCriacao }),
    };

    const [total, casos] = await this.prisma.$transaction([
      this.prisma.processo.count({ where }),
      this.prisma.processo.findMany({
        where,
        orderBy: { dataCriacao: 'desc' },
        skip: q.skip,
        take: q.take,
        include: {
          cliente: { select: { id: true, nome: true } },
          _count: { select: { propostas: { where: { softDelete: false } } } },
          // proposta ATIVA (pendente) do próprio advogado neste caso — cancelada/recusada não conta,
          // liberando o card para reenviar.
          propostas: {
            where: { advogadoId, softDelete: false, status: 'pendente' },
            select: { id: true, mensagem: true, valorEstimado: true, status: true, justificativa: true },
          },
        },
      }),
    ]);
    // Achata `propostas` (0-1 item) em `minhaProposta`.
    const dados = casos.map(({ propostas, ...c }) => ({ ...c, minhaProposta: propostas[0] ?? null }));
    return paginated(dados, total, { page: q.page, pageSize: q.pageSize });
  }

  async findOne(id: number) {
    const processo = await this.prisma.processo.findFirst({
      where: { id, softDelete: false },
      include: {
        cliente: { select: { id: true, nome: true } },
        propostas: {
          where: { softDelete: false },
          include: {
            advogado: { select: { id: true, nome: true, oab: true } },
          },
        },
      },
    });
    if (!processo) throw new NotFoundException('Processo não encontrado');
    return processo;
  }

  async remover(id: number, clienteId: number) {
    const processo = await this.prisma.processo.findFirst({
      where: { id, softDelete: false },
    });
    if (!processo) throw new NotFoundException('Processo não encontrado');
    if (processo.clienteId !== clienteId)
      throw new ForbiddenException('Você não pode remover este processo');
    return this.prisma.processo.update({
      where: { id },
      data: { softDelete: true },
    });
  }

  async criarProposta(processoId: number, advogadoId: number, dto: CriarPropostaDto) {
    const processo = await this.prisma.processo.findFirst({
      where: { id: processoId, softDelete: false },
    });
    if (!processo) throw new NotFoundException('Processo não encontrado');
    if (processo.status !== 'aberto')
      throw new BadRequestException('Processo não está mais aberto a propostas');

    const existente = await this.prisma.proposta.findFirst({
      where: { processoId, advogadoId, softDelete: false },
    });
    // Já tem proposta ativa (pendente/aceita) → bloqueia. Cancelada/recusada → reaproveita a linha.
    if (existente && (existente.status === 'pendente' || existente.status === 'aceita'))
      throw new ConflictException('Você já enviou uma proposta para este processo');

    const quota = await this.quotaMensal(advogadoId);
    if (quota.limite !== null && quota.usadas >= quota.limite) {
      throw new ForbiddenException(
        `Limite mensal do plano ${quota.plano} atingido (${quota.usadas}/${quota.limite}). Faça upgrade para enviar mais propostas.`,
      );
    }

    const proposta = existente
      ? await this.prisma.proposta.update({
          where: { id: existente.id },
          data: { mensagem: dto.mensagem, valorEstimado: dto.valorEstimado, status: 'pendente', justificativa: null, dataCriacao: new Date() },
        })
      : await this.prisma.proposta.create({
          data: {
            processoId,
            advogadoId,
            mensagem: dto.mensagem,
            valorEstimado: dto.valorEstimado,
          },
        });
    await this.notificacoes.criar(
      processo.clienteId,
      'cliente',
      'nova_proposta',
      'Nova proposta recebida',
      `Você recebeu uma nova proposta no caso "${processo.titulo}".`,
    );
    return proposta;
  }

  async aceitarProposta(propostaId: number, clienteId: number) {
    const proposta = await this.prisma.proposta.findFirst({
      where: { id: propostaId, softDelete: false },
      include: { processo: true },
    });
    if (!proposta) throw new NotFoundException('Proposta não encontrada');
    if (proposta.processo.clienteId !== clienteId)
      throw new ForbiddenException('Você não pode aceitar esta proposta');
    if (proposta.processo.status !== 'aberto')
      throw new BadRequestException('Processo não está mais aberto');

    // Auto-recusa das demais propostas ao aceitar: CONFIGURÁVEL (default ligado).
    // Só desliga se AUTO_RECUSAR_PROPOSTAS_AO_ACEITAR === 'false'.
    const autoRecusar = process.env.AUTO_RECUSAR_PROPOSTAS_AO_ACEITAR !== 'false';

    const resultado = await this.prisma.$transaction(async (tx) => {
      const aceita = await tx.proposta.update({
        where: { id: propostaId },
        data: { status: 'aceita' },
      });
      if (autoRecusar) {
        await tx.proposta.updateMany({
          where: { processoId: proposta.processoId, id: { not: propostaId }, status: 'pendente' },
          data: { status: 'recusada' },
        });
      }
      await tx.processo.update({
        where: { id: proposta.processoId },
        data: { status: 'em_atendimento' },
      });
      const vinculoExistente = await tx.clienteAdvogado.findFirst({
        where: {
          clienteId: proposta.processo.clienteId,
          advogadoId: proposta.advogadoId,
          softDelete: false,
        },
      });
      if (!vinculoExistente) {
        await tx.clienteAdvogado.create({
          data: {
            clienteId: proposta.processo.clienteId,
            advogadoId: proposta.advogadoId,
          },
        });
      }
      return aceita;
    });

    await this.notificacoes.criar(
      proposta.advogadoId,
      'advogado',
      'proposta_aceita',
      'Proposta aceita! 🎉',
      `Sua proposta no caso "${proposta.processo.titulo}" foi aceita. Você agora é o advogado responsável.`,
    );
    return resultado;
  }

  async recusarProposta(propostaId: number, clienteId: number) {
    const proposta = await this.prisma.proposta.findFirst({
      where: { id: propostaId, softDelete: false },
      include: { processo: { select: { clienteId: true } } },
    });
    if (!proposta) throw new NotFoundException('Proposta não encontrada');
    if (proposta.processo.clienteId !== clienteId)
      throw new ForbiddenException('Você não pode recusar esta proposta');
    return this.prisma.proposta.update({
      where: { id: propostaId },
      data: { status: 'recusada' },
    });
  }

  /** Encerra um caso. Autorizado ao cliente dono OU ao advogado responsável (proposta aceita). */
  async encerrarCaso(
    processoId: number,
    usuario: { id: number; tipo: 'cliente' | 'advogado' },
    justificativa?: string,
  ) {
    const processo = await this.prisma.processo.findFirst({
      where: { id: processoId, softDelete: false },
      include: {
        propostas: { where: { status: 'aceita', softDelete: false }, select: { advogadoId: true } },
      },
    });
    if (!processo) throw new NotFoundException('Caso não encontrado');
    if (processo.status === 'encerrado')
      throw new BadRequestException('Caso já está encerrado');

    if (usuario.tipo === 'cliente') {
      if (processo.clienteId !== usuario.id)
        throw new ForbiddenException('Você não pode encerrar este caso');
    } else {
      const responsavel = processo.propostas.some((p) => p.advogadoId === usuario.id);
      if (!responsavel)
        throw new ForbiddenException('Você não é o advogado responsável por este caso');
    }

    const motivo = justificativa?.trim() || null;
    const atualizado = await this.prisma.processo.update({
      where: { id: processoId },
      data: { status: 'encerrado', ...(motivo && { motivoEncerramento: motivo }) },
    });
    // Advogado encerrou → notifica o cliente com o motivo.
    if (usuario.tipo === 'advogado') {
      await this.notificacoes.criar(
        processo.clienteId,
        'cliente',
        'caso_encerrado',
        'Seu caso foi encerrado',
        `O advogado encerrou o caso "${processo.titulo}".${motivo ? ` Motivo: ${motivo}` : ''}`,
      );
    }
    return atualizado;
  }

  /** Advogado edita a própria proposta (enquanto pendente e com o caso aberto). */
  async editarProposta(propostaId: number, advogadoId: number, dto: CriarPropostaDto) {
    const proposta = await this.prisma.proposta.findFirst({
      where: { id: propostaId, softDelete: false },
      include: { processo: { select: { status: true } } },
    });
    if (!proposta) throw new NotFoundException('Proposta não encontrada');
    if (proposta.advogadoId !== advogadoId)
      throw new ForbiddenException('Você só pode editar as próprias propostas');
    if (proposta.status !== 'pendente')
      throw new BadRequestException('Só é possível editar propostas pendentes');
    if (proposta.processo.status !== 'aberto')
      throw new BadRequestException('O caso não está mais aberto a propostas');
    return this.prisma.proposta.update({
      where: { id: propostaId },
      data: { mensagem: dto.mensagem, valorEstimado: dto.valorEstimado },
    });
  }

  /** Advogado cancela a própria proposta (pendente), com justificativa exibida ao cliente. */
  async cancelarProposta(propostaId: number, advogadoId: number, justificativa: string) {
    const proposta = await this.prisma.proposta.findFirst({
      where: { id: propostaId, softDelete: false },
      include: { processo: { select: { clienteId: true, titulo: true } } },
    });
    if (!proposta) throw new NotFoundException('Proposta não encontrada');
    if (proposta.advogadoId !== advogadoId)
      throw new ForbiddenException('Você só pode cancelar as próprias propostas');
    if (proposta.status !== 'pendente')
      throw new BadRequestException('Só é possível cancelar propostas pendentes');

    const cancelada = await this.prisma.proposta.update({
      where: { id: propostaId },
      data: { status: 'cancelada', justificativa: justificativa.trim() },
    });
    await this.notificacoes.criar(
      proposta.processo.clienteId,
      'cliente',
      'proposta_cancelada',
      'Uma proposta foi cancelada',
      `Uma proposta no caso "${proposta.processo.titulo}" foi cancelada. Motivo: ${justificativa.trim()}`,
    );
    return cancelada;
  }

  /**
   * Casos em que o advogado está envolvido (enviou proposta), sob a ÓTICA dele:
   * - `status` é o status para o advogado (recusada/cancelada → "encerrado" pra ele);
   * - relatórios/andamento só aparecem para o RESPONSÁVEL (proposta aceita).
   * Quem foi recusado não acompanha o progresso do processo (privacidade).
   */
  async meusCasosAdvogado(advogadoId: number) {
    const casos = await this.prisma.processo.findMany({
      where: { softDelete: false, propostas: { some: { advogadoId, softDelete: false } } },
      orderBy: { dataCriacao: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true } },
        propostas: {
          where: { advogadoId, softDelete: false },
          select: { id: true, status: true, valorEstimado: true, justificativa: true },
        },
        relatorios: {
          where: { softDelete: false },
          orderBy: { dataCriacao: 'desc' },
          include: { advogado: { select: { nome: true } } },
        },
      },
    });

    return casos.map((c) => {
      const minha = c.propostas[0];
      const souResponsavel = minha?.status === 'aceita';
      const perdida = minha?.status === 'recusada' || minha?.status === 'cancelada';
      return {
        ...c,
        // status na visão do advogado: perdeu → encerrado; senão o status real do caso
        status: perdida ? 'encerrado' : c.status,
        souResponsavel,
        minhaPropostaStatus: minha?.status ?? null,
        // andamento só para o responsável — recusado NÃO vê os relatórios
        relatorios: souResponsavel ? c.relatorios : [],
      };
    });
  }

  /** Registra um relatório de situação. Só o advogado responsável (proposta aceita) pode. */
  async adicionarRelatorio(processoId: number, advogadoId: number, texto: string) {
    const responsavel = await this.prisma.proposta.findFirst({
      where: { processoId, advogadoId, status: 'aceita', softDelete: false },
    });
    if (!responsavel)
      throw new ForbiddenException('Apenas o advogado responsável pode registrar relatórios');
    const relatorio = await this.prisma.relatorioCaso.create({
      data: { processoId, advogadoId, texto },
    });
    const proc = await this.prisma.processo.findUnique({
      where: { id: processoId },
      select: { clienteId: true, titulo: true },
    });
    if (proc) {
      await this.notificacoes.criar(
        proc.clienteId,
        'cliente',
        'novo_relatorio',
        'Atualização no seu caso',
        `Há um novo relatório de situação no caso "${proc.titulo}".`,
      );
    }
    return relatorio;
  }

  /** Busca um relatório garantindo que pertence ao advogado (autoria). */
  private async relatorioDoAutor(relatorioId: number, advogadoId: number) {
    const relatorio = await this.prisma.relatorioCaso.findFirst({
      where: { id: relatorioId, softDelete: false },
    });
    if (!relatorio) throw new NotFoundException('Relatório não encontrado');
    if (relatorio.advogadoId !== advogadoId)
      throw new ForbiddenException('Você só pode alterar os próprios relatórios');
    return relatorio;
  }

  /** Edita o texto de um relatório. Só o advogado autor pode. */
  async editarRelatorio(relatorioId: number, advogadoId: number, texto: string) {
    await this.relatorioDoAutor(relatorioId, advogadoId);
    return this.prisma.relatorioCaso.update({
      where: { id: relatorioId },
      data: { texto },
    });
  }

  /** Remove (soft delete) um relatório. Só o advogado autor pode. */
  async removerRelatorio(relatorioId: number, advogadoId: number) {
    await this.relatorioDoAutor(relatorioId, advogadoId);
    return this.prisma.relatorioCaso.update({
      where: { id: relatorioId },
      data: { softDelete: true },
    });
  }
}
