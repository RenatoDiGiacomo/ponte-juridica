import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdvogadoPublicoDTO,
  AdvogadoContatoDTO,
  SELECT_ADVOGADO_DTO,
  toAdvogadoPublico,
  toAdvogadoContato,
} from './dto/advogado-response.dto';

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

  /** Perfil do PRÓPRIO advogado logado — inclui dados de contato (é o dono). */
  async findPerfil(id: number): Promise<AdvogadoContatoDTO | null> {
    const adv = await this.prisma.advogado.findFirst({
      where: { id, softDelete: false },
      select: SELECT_ADVOGADO_DTO,
    });
    return adv ? toAdvogadoContato(adv) : null;
  }
}
