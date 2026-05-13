import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarProcessoDto } from './dto/criar-processo.dto';
import { CriarPropostaDto } from './dto/criar-proposta.dto';

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
            advogado: { select: { id: true, nome: true, especializacao: true, oab: true } },
          },
        },
      },
    });
  }

  /** Lista de processos abertos para advogados — default filtra pela especialização do advogado logado. */
  async listarAbertos(advogadoId: number, especializacao?: string) {
    const advogado = await this.prisma.advogado.findFirst({
      where: { id: advogadoId, softDelete: false },
      select: { especializacao: true },
    });
    const filtro = especializacao ?? advogado?.especializacao;
    return this.prisma.processo.findMany({
      where: {
        softDelete: false,
        status: 'aberto',
        ...(filtro && { especializacao: filtro }),
      },
      orderBy: { dataCriacao: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true } },
        _count: { select: { propostas: { where: { softDelete: false } } } },
      },
    });
  }

  async findOne(id: number) {
    const processo = await this.prisma.processo.findFirst({
      where: { id, softDelete: false },
      include: {
        cliente: { select: { id: true, nome: true } },
        propostas: {
          where: { softDelete: false },
          include: {
            advogado: { select: { id: true, nome: true, especializacao: true, oab: true } },
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

    return this.prisma.$transaction(async (tx) => {
      const aceita = await tx.proposta.update({
        where: { id: propostaId },
        data: { status: 'aceita' },
      });
      await tx.proposta.updateMany({
        where: { processoId: proposta.processoId, id: { not: propostaId }, status: 'pendente' },
        data: { status: 'recusada' },
      });
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
}
