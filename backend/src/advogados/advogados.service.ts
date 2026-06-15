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
    const where: Prisma.AdvogadoWhereInput = {
      softDelete: false,
      assinatura: 'ativo',
      ...(q.area && { areas: { some: { area: { nome: q.area } } } }),
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
    try {
      await this.prisma.advogado.update({ where: { id }, data: { ...dto } });
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
}
