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

@Injectable()
export class AdvogadosService {
  constructor(private prisma: PrismaService) {}

  /** Listagem pública — SEM dados de contato (privacidade). */
  async findAll(especializacao?: string): Promise<AdvogadoPublicoDTO[]> {
    const advs = await this.prisma.advogado.findMany({
      where: {
        softDelete: false,
        assinatura: 'ativo',
        ...(especializacao && { especializacao }),
      },
      select: SELECT_ADVOGADO_DTO,
    });
    return advs.map(toAdvogadoPublico);
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
}
