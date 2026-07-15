import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { CriarAvaliacaoDto } from './dto/criar-avaliacao.dto';

@Injectable()
export class AvaliacoesService {
  constructor(
    private prisma: PrismaService,
    private notificacoes: NotificacoesService,
  ) {}

  /** Cliente avalia o advogado responsável por um caso ENCERRADO (1 avaliação por caso). */
  async criar(clienteId: number, dto: CriarAvaliacaoDto) {
    const processo = await this.prisma.processo.findFirst({
      where: { id: dto.processoId, clienteId, softDelete: false },
      include: {
        propostas: { where: { status: 'aceita', softDelete: false }, select: { advogadoId: true } },
      },
    });
    if (!processo) throw new NotFoundException('Caso não encontrado');
    if (processo.status !== 'encerrado')
      throw new BadRequestException('Só é possível avaliar casos encerrados');
    const advogadoId = processo.propostas[0]?.advogadoId;
    if (!advogadoId) throw new BadRequestException('Este caso não teve advogado responsável');

    const jaExiste = await this.prisma.avaliacao.findFirst({
      where: { processoId: dto.processoId, clienteId, softDelete: false },
    });
    if (jaExiste) throw new ConflictException('Você já avaliou este caso');

    const avaliacao = await this.prisma.avaliacao.create({
      data: {
        processoId: dto.processoId,
        clienteId,
        advogadoId,
        nota: dto.nota,
        comentario: dto.comentario,
      },
    });

    await this.recalcularNota(advogadoId);
    await this.notificacoes.criar(
      advogadoId,
      'advogado',
      'nova_avaliacao',
      'Nova avaliação recebida',
      `Você recebeu ${dto.nota}★ no caso "${processo.titulo}".`,
    );

    return avaliacao;
  }

  /** Recalcula a média de notas do advogado (arredondada a 1 casa). */
  private async recalcularNota(advogadoId: number) {
    const agg = await this.prisma.avaliacao.aggregate({
      where: { advogadoId, softDelete: false },
      _avg: { nota: true },
    });
    const media = agg._avg.nota;
    await this.prisma.advogado.update({
      where: { id: advogadoId },
      data: { nota: media != null ? Math.round(media * 10) / 10 : null },
    });
  }

  /** Avaliações públicas de um advogado (para a vitrine/perfil). */
  async listarPorAdvogado(advogadoId: number) {
    const rows = await this.prisma.avaliacao.findMany({
      where: { advogadoId, softDelete: false },
      orderBy: { dataCriacao: 'desc' },
      take: 20,
      include: { cliente: { select: { nome: true } } },
    });
    const agg = await this.prisma.avaliacao.aggregate({
      where: { advogadoId, softDelete: false },
      _avg: { nota: true },
      _count: true,
    });
    return {
      media: agg._avg.nota != null ? Math.round(agg._avg.nota * 10) / 10 : null,
      total: agg._count,
      avaliacoes: rows.map((r) => ({
        id: r.id,
        nota: r.nota,
        comentario: r.comentario,
        dataCriacao: r.dataCriacao,
        cliente: r.cliente.nome,
      })),
    };
  }
}
