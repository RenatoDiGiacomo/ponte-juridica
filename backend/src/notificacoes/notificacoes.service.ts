import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type UsuarioTipo = 'cliente' | 'advogado';

@Injectable()
export class NotificacoesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cria uma notificação (best-effort: nunca propaga erro para o fluxo principal —
   * uma falha ao notificar não deve derrubar a ação que a originou).
   */
  async criar(
    destinatarioId: number,
    destinatarioTipo: UsuarioTipo,
    tipo: string,
    titulo: string,
    mensagem: string,
  ) {
    try {
      await this.prisma.notificacao.create({
        data: { destinatarioId, destinatarioTipo, tipo, titulo, mensagem },
      });
    } catch {
      // silencioso por design
    }
  }

  listar(usuarioId: number, tipo: UsuarioTipo) {
    return this.prisma.notificacao.findMany({
      where: { destinatarioId: usuarioId, destinatarioTipo: tipo },
      orderBy: { dataCriacao: 'desc' },
      take: 50,
    });
  }

  contarNaoLidas(usuarioId: number, tipo: UsuarioTipo) {
    return this.prisma.notificacao.count({
      where: { destinatarioId: usuarioId, destinatarioTipo: tipo, lida: false },
    });
  }

  async marcarLida(id: number, usuarioId: number, tipo: UsuarioTipo) {
    await this.prisma.notificacao.updateMany({
      where: { id, destinatarioId: usuarioId, destinatarioTipo: tipo },
      data: { lida: true },
    });
    return { ok: true };
  }

  async marcarTodasLidas(usuarioId: number, tipo: UsuarioTipo) {
    await this.prisma.notificacao.updateMany({
      where: { destinatarioId: usuarioId, destinatarioTipo: tipo, lida: false },
      data: { lida: true },
    });
    return { ok: true };
  }
}
