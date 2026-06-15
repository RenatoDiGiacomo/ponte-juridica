import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private prisma: PrismaService) {}

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

    const where: Prisma.ProcessoWhereInput = {
      softDelete: false,
      status: 'aberto',
      ...(q.area
        ? { especializacao: q.area }
        : minhasAreas.length
          ? { especializacao: { in: minhasAreas } }
          : {}),
      ...(q.estado && { estado: q.estado }),
      ...(q.cidade && { cidade: { contains: q.cidade } }),
      ...(q.postadoDias && {
        dataCriacao: { gte: new Date(Date.now() - q.postadoDias * 86_400_000) },
      }),
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
        },
      }),
    ]);
    return paginated(casos, total, { page: q.page, pageSize: q.pageSize });
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

    const jaExiste = await this.prisma.proposta.findFirst({
      where: { processoId, advogadoId, softDelete: false },
    });
    if (jaExiste) throw new ConflictException('Você já enviou uma proposta para este processo');

    const quota = await this.quotaMensal(advogadoId);
    if (quota.limite !== null && quota.usadas >= quota.limite) {
      throw new ForbiddenException(
        `Limite mensal do plano ${quota.plano} atingido (${quota.usadas}/${quota.limite}). Faça upgrade para enviar mais propostas.`,
      );
    }

    return this.prisma.proposta.create({
      data: {
        processoId,
        advogadoId,
        mensagem: dto.mensagem,
        valorEstimado: dto.valorEstimado,
      },
    });
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

    return this.prisma.$transaction(async (tx) => {
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
  async encerrarCaso(processoId: number, usuario: { id: number; tipo: 'cliente' | 'advogado' }) {
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

    return this.prisma.processo.update({
      where: { id: processoId },
      data: { status: 'encerrado' },
    });
  }

  /** Casos em que o advogado está envolvido (enviou proposta), com sua proposta e o histórico de relatórios. */
  meusCasosAdvogado(advogadoId: number) {
    return this.prisma.processo.findMany({
      where: { softDelete: false, propostas: { some: { advogadoId, softDelete: false } } },
      orderBy: { dataCriacao: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true } },
        propostas: {
          where: { advogadoId, softDelete: false },
          select: { id: true, status: true, valorEstimado: true },
        },
        relatorios: {
          where: { softDelete: false },
          orderBy: { dataCriacao: 'desc' },
          include: { advogado: { select: { nome: true } } },
        },
      },
    });
  }

  /** Registra um relatório de situação. Só o advogado responsável (proposta aceita) pode. */
  async adicionarRelatorio(processoId: number, advogadoId: number, texto: string) {
    const responsavel = await this.prisma.proposta.findFirst({
      where: { processoId, advogadoId, status: 'aceita', softDelete: false },
    });
    if (!responsavel)
      throw new ForbiddenException('Apenas o advogado responsável pode registrar relatórios');
    return this.prisma.relatorioCaso.create({
      data: { processoId, advogadoId, texto },
    });
  }
}
