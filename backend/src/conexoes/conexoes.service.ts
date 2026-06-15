import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SELECT_ADVOGADO_DTO, toAdvogadoContato } from '../advogados/dto/advogado-response.dto';

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

  /** Advogados vinculados COM contatos (escopo de vínculo — NFR3). */
  async minhasConexoes(clienteId: number) {
    const rows = await this.prisma.clienteAdvogado.findMany({
      where: { clienteId, softDelete: false },
      orderBy: { dataVinculo: 'desc' },
      include: { advogado: { select: SELECT_ADVOGADO_DTO } },
    });
    return rows.map((r) => ({
      id: r.id,
      dataVinculo: r.dataVinculo,
      advogado: toAdvogadoContato(r.advogado),
    }));
  }

  meusClientes(advogadoId: number) {
    return this.prisma.clienteAdvogado.findMany({
      where: { advogadoId, softDelete: false },
      orderBy: { dataVinculo: 'desc' },
      include: {
        cliente: { select: { id: true, nome: true, email: true, documento: true, dataCadastro: true } },
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
