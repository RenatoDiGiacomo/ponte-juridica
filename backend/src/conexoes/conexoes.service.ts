import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
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
        advogado: { select: { id: true, nome: true } },
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

  /**
   * Detalhe de um cliente vinculado ao advogado (escopo de vínculo — NFR3).
   * Retorna contato + endereço resumido + os casos compartilhados (onde o advogado
   * enviou proposta). NÃO expõe documento (CPF/CNPJ) — privacidade.
   */
  async detalheCliente(advogadoId: number, clienteId: number) {
    const vinculo = await this.prisma.clienteAdvogado.findFirst({
      where: { advogadoId, clienteId, softDelete: false },
      orderBy: { dataVinculo: 'asc' },
    });
    if (!vinculo)
      throw new ForbiddenException('Cliente não vinculado a você');

    const cliente = await this.prisma.cliente.findFirst({
      where: { id: clienteId, softDelete: false },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        enderecoCidade: true,
        enderecoEstado: true,
        dataCadastro: true,
      },
    });
    if (!cliente) throw new ForbiddenException('Cliente não encontrado');

    // Casos compartilhados: do cliente, onde ESTE advogado enviou proposta.
    const casos = await this.prisma.processo.findMany({
      where: {
        clienteId,
        softDelete: false,
        propostas: { some: { advogadoId, softDelete: false } },
      },
      orderBy: { dataCriacao: 'desc' },
      select: {
        id: true,
        titulo: true,
        especializacao: true,
        status: true,
        dataCriacao: true,
        propostas: {
          where: { advogadoId, softDelete: false },
          select: { status: true, valorEstimado: true },
        },
      },
    });

    return {
      ...cliente,
      vinculadoDesde: vinculo.dataVinculo,
      casos: casos.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        especializacao: c.especializacao,
        status: c.status,
        dataCriacao: c.dataCriacao,
        minhaProposta: c.propostas[0]
          ? { status: c.propostas[0].status, valorEstimado: c.propostas[0].valorEstimado }
          : null,
      })),
    };
  }

  async desconectar(id: number) {
    return this.prisma.clienteAdvogado.update({
      where: { id },
      data: { softDelete: true },
    });
  }
}
