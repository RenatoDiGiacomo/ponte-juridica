import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdvogadosService {
  constructor(private prisma: PrismaService) {}

  findAll(especializacao?: string) {
    return this.prisma.advogado.findMany({
      where: {
        softDelete: false,
        assinatura: 'ativo',
        ...(especializacao && { especializacao }),
      },
      include: { plano: true },
      select: {
        id: true, nome: true, email: true,
        especializacao: true, oab: true, assinatura: true,
        plano: { select: { id: true, nome: true } },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.advogado.findFirst({
      where: { id, softDelete: false },
      include: { plano: true, conexoes: { where: { softDelete: false } } },
    });
  }

  findPerfil(id: number) {
    return this.prisma.advogado.findFirst({
      where: { id, softDelete: false },
      select: {
        id: true, nome: true, email: true,
        especializacao: true, oab: true, assinatura: true,
        dataCadastro: true,
        plano: true,
        conexoes: {
          where: { softDelete: false },
          include: { cliente: { select: { id: true, nome: true, email: true } } },
        },
      },
    });
  }
}
