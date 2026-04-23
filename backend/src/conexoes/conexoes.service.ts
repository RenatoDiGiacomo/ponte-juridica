import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConexoesService {
  constructor(private prisma: PrismaService) {}

  async conectar(clienteId: number, advogadoId: number) {
    const existe = await this.prisma.clienteAdvogado.findFirst({
      where: { clienteId, advogadoId, softDelete: false },
    });
    if (existe) throw new ConflictException('Vínculo já existe');
    return this.prisma.clienteAdvogado.create({
      data: { clienteId, advogadoId },
      include: {
        advogado: { select: { id: true, nome: true, especializacao: true } },
      },
    });
  }

  minhasConexoes(clienteId: number) {
    return this.prisma.clienteAdvogado.findMany({
      where: { clienteId, softDelete: false },
      include: {
        advogado: { select: { id: true, nome: true, especializacao: true, oab: true } },
      },
    });
  }

  async desconectar(id: number) {
    return this.prisma.clienteAdvogado.update({
      where: { id },
      data: { softDelete: true },
    });
  }
}
