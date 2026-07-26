import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdvogadoPublicoDTO,
  AdvogadoPerfilDTO,
  SELECT_ADVOGADO_DTO,
  toAdvogadoPublico,
  toAdvogadoContato,
} from './dto/advogado-response.dto';
import { AtualizarPerfilAdvogadoDto } from './dto/atualizar-perfil-advogado.dto';
import { BuscarAdvogadosQueryDto } from './dto/buscar-advogados-query.dto';
import { PaginatedDTO, paginated } from '../common/dto/pagination-query.dto';

@Injectable()
export class AdvogadosService {
  constructor(private prisma: PrismaService) {}

  /** Busca filtrada e paginada (área/nota/estado/vínculo). Vínculo usa o cliente logado. */
  async buscar(
    q: BuscarAdvogadosQueryDto,
    clienteId?: number,
  ): Promise<PaginatedDTO<AdvogadoPublicoDTO>> {
    const areasFiltro = q.areas?.length ? q.areas : q.area ? [q.area] : [];
    const where: Prisma.AdvogadoWhereInput = {
      softDelete: false,
      assinatura: 'ativo',
      ...(q.busca && { nome: { contains: q.busca } }),
      ...(areasFiltro.length && { areas: { some: { area: { nome: { in: areasFiltro } } } } }),
      ...(q.estado && { estadoAtuacao: q.estado }),
      ...(q.notaMin != null && { nota: { gte: q.notaMin } }),
    };
    if (clienteId && q.vinculo === 'vinculado') {
      where.conexoes = { some: { clienteId, softDelete: false } };
    } else if (clienteId && q.vinculo === 'nao') {
      where.conexoes = { none: { clienteId, softDelete: false } };
    }

    const [total, advs] = await this.prisma.$transaction([
      this.prisma.advogado.count({ where }),
      this.prisma.advogado.findMany({
        where,
        select: SELECT_ADVOGADO_DTO,
        orderBy: [{ nota: 'desc' }, { id: 'asc' }],
        skip: q.skip,
        take: q.take,
      }),
    ]);
    return paginated(advs.map(toAdvogadoPublico), total, { page: q.page, pageSize: q.pageSize });
  }

  /** Perfil público de um advogado — SEM dados de contato. */
  async findOne(id: number): Promise<AdvogadoPublicoDTO | null> {
    const adv = await this.prisma.advogado.findFirst({
      where: { id, softDelete: false },
      select: SELECT_ADVOGADO_DTO,
    });
    return adv ? toAdvogadoPublico(adv) : null;
  }

  /** Perfil do PRÓPRIO advogado logado — contato + plano completo + contagem de clientes. */
  async findPerfil(id: number): Promise<AdvogadoPerfilDTO | null> {
    const adv = await this.prisma.advogado.findFirst({
      where: { id, softDelete: false },
      select: {
        ...SELECT_ADVOGADO_DTO,
        plano: { select: { id: true, nome: true, valorMensal: true, valorAnual: true } },
      },
    });
    if (!adv) return null;
    const clientesVinculados = await this.prisma.clienteAdvogado.count({
      where: { advogadoId: id, softDelete: false },
    });
    return {
      ...toAdvogadoContato(adv),
      assinatura: (adv as { assinatura?: string }).assinatura,
      dataCadastro: (adv as { dataCadastro?: Date }).dataCadastro?.toISOString(),
      plano: adv.plano
        ? {
            id: adv.plano.id,
            nome: adv.plano.nome,
            valorMensal: String(adv.plano.valorMensal),
            valorAnual: String(adv.plano.valorAnual),
          }
        : null,
      clientesVinculados,
    };
  }

  /** Atualiza dados do próprio perfil (nome/OAB/estado/cidade). */
  async atualizarPerfil(id: number, dto: AtualizarPerfilAdvogadoDto): Promise<AdvogadoPerfilDTO | null> {
    // '' → null nos campos opcionais (não guardar string vazia). nome/oab passam como estão.
    const OBRIGATORIOS = new Set(['nome', 'oab']);
    const data: Prisma.AdvogadoUpdateInput = {};
    for (const [chave, valor] of Object.entries(dto)) {
      if (valor === undefined) continue;
      (data as Record<string, unknown>)[chave] =
        valor === '' && !OBRIGATORIOS.has(chave) ? null : valor;
    }
    try {
      await this.prisma.advogado.update({ where: { id }, data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('OAB já cadastrada para outro advogado');
      }
      throw e;
    }
    return this.findPerfil(id);
  }

  /** Adiciona uma área de atuação ao advogado (idempotente). */
  async adicionarArea(advogadoId: number, areaId: number): Promise<AdvogadoPerfilDTO | null> {
    const area = await this.prisma.area.findUnique({ where: { id: areaId } });
    if (!area) throw new NotFoundException('Área não encontrada');
    await this.prisma.advogadoArea.upsert({
      where: { advogadoId_areaId: { advogadoId, areaId } },
      update: {},
      create: { advogadoId, areaId },
    });
    return this.findPerfil(advogadoId);
  }

  /** Remove uma área de atuação do advogado (hard delete; sem erro se não existir). */
  async removerArea(advogadoId: number, areaId: number): Promise<AdvogadoPerfilDTO | null> {
    await this.prisma.advogadoArea.deleteMany({ where: { advogadoId, areaId } });
    return this.findPerfil(advogadoId);
  }

  /** Efetiva a troca de plano (sem cobrança real). A cota recalcula a partir do novo plano. */
  async trocarPlano(advogadoId: number, planoId: number): Promise<AdvogadoPerfilDTO | null> {
    const plano = await this.prisma.plano.findFirst({ where: { id: planoId, softDelete: false } });
    if (!plano) throw new NotFoundException('Plano não encontrado');
    await this.prisma.advogado.update({ where: { id: advogadoId }, data: { planoId } });
    return this.findPerfil(advogadoId);
  }

  /**
   * KPIs do advogado para o dashboard, com recorte por período (ano; mês opcional)
   * e série mensal do ano para o gráfico. "No período" = por dataCriacao da proposta;
   * "situação atual" = totais correntes (não dependem do período).
   */
  async dashboard(advogadoId: number, ano?: number, mes?: number) {
    const anoAtual = ano ?? new Date().getFullYear();
    const inicioPeriodo = new Date(anoAtual, mes ? mes - 1 : 0, 1);
    const fimPeriodo = mes ? new Date(anoAtual, mes, 1) : new Date(anoAtual + 1, 0, 1);
    const periodo = { gte: inicioPeriodo, lt: fimPeriodo };
    const inicioAno = new Date(anoAtual, 0, 1);
    const fimAno = new Date(anoAtual + 1, 0, 1);

    const [enviadas, aceitas, faturamento, novosClientes, propostasAno, ativos, clientes, aval] =
      await Promise.all([
        this.prisma.proposta.count({ where: { advogadoId, softDelete: false, dataCriacao: periodo } }),
        this.prisma.proposta.count({ where: { advogadoId, status: 'aceita', softDelete: false, dataCriacao: periodo } }),
        this.prisma.proposta.aggregate({ where: { advogadoId, status: 'aceita', softDelete: false, dataCriacao: periodo }, _sum: { valorEstimado: true } }),
        this.prisma.clienteAdvogado.count({ where: { advogadoId, softDelete: false, dataVinculo: periodo } }),
        this.prisma.proposta.findMany({
          where: { advogadoId, softDelete: false, dataCriacao: { gte: inicioAno, lt: fimAno } },
          select: { status: true, dataCriacao: true },
        }),
        this.prisma.processo.count({ where: { status: 'em_atendimento', softDelete: false, propostas: { some: { advogadoId, status: 'aceita', softDelete: false } } } }),
        this.prisma.clienteAdvogado.count({ where: { advogadoId, softDelete: false } }),
        this.prisma.avaliacao.aggregate({ where: { advogadoId, softDelete: false }, _avg: { nota: true }, _count: true }),
      ]);

    // Série mensal (12 meses) do ano selecionado.
    const serie = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, enviadas: 0, aceitas: 0 }));
    for (const p of propostasAno) {
      const idx = p.dataCriacao.getMonth();
      serie[idx].enviadas++;
      if (p.status === 'aceita') serie[idx].aceitas++;
    }

    return {
      ano: anoAtual,
      mes: mes ?? 0,
      periodo: {
        propostasEnviadas: enviadas,
        propostasAceitas: aceitas,
        taxaAceite: enviadas ? Math.round((aceitas / enviadas) * 100) : 0,
        faturamentoEstimado: Number(faturamento._sum.valorEstimado ?? 0),
        novosClientes,
      },
      atual: {
        casosAtivos: ativos,
        clientesVinculados: clientes,
        notaMedia: aval._avg.nota != null ? Math.round(aval._avg.nota * 10) / 10 : null,
        totalAvaliacoes: aval._count,
      },
      serie,
    };
  }
}
