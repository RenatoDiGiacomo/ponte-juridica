import { Injectable, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SELECT_ADVOGADO_DTO, toAdvogadoContato } from '../advogados/dto/advogado-response.dto';
import { paginated } from '../common/dto/pagination-query.dto';
import { MeusClientesQueryDto } from './dto/meus-clientes-query.dto';

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

  /** Clientes vinculados ao advogado, com busca (nome/CPF) e paginação (A5). */
  async meusClientes(advogadoId: number, q: MeusClientesQueryDto) {
    const where: Prisma.ClienteAdvogadoWhereInput = {
      advogadoId,
      softDelete: false,
      ...(q.busca && {
        cliente: {
          OR: [
            { nome: { contains: q.busca } },
            { documento: { contains: q.busca } },
          ],
        },
      }),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.clienteAdvogado.count({ where }),
      this.prisma.clienteAdvogado.findMany({
        where,
        orderBy: { dataVinculo: 'desc' },
        skip: q.skip,
        take: q.take,
        // documento NÃO é exibido (privacidade) — só usado no filtro acima.
        include: { cliente: { select: { id: true, nome: true, email: true, dataCadastro: true } } },
      }),
    ]);
    return paginated(rows, total, { page: q.page, pageSize: q.pageSize });
  }

  async desconectar(id: number) {
    return this.prisma.clienteAdvogado.update({
      where: { id },
      data: { softDelete: true },
    });
  }
}
