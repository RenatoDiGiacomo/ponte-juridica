import { Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

type Usuario = { id: number; tipo: 'cliente' | 'advogado' };

@Injectable()
export class MidiaService {
  constructor(private prisma: PrismaService) {}

  /** Salva o caminho público da foto no perfil (cliente ou advogado). */
  async salvarFoto(u: Usuario, filename: string) {
    const fotoPath = `/uploads/fotos/${filename}`;
    if (u.tipo === 'advogado') {
      await this.prisma.advogado.update({ where: { id: u.id }, data: { fotoPath } });
    } else {
      await this.prisma.cliente.update({ where: { id: u.id }, data: { fotoPath } });
    }
    return { fotoPath };
  }

  /** Salva o caminho (privado, relativo) do documento do cliente. Nunca exposto publicamente. */
  async salvarDocumento(clienteId: number, filename: string) {
    const documentoPath = join('uploads', 'documentos', filename);
    await this.prisma.cliente.update({ where: { id: clienteId }, data: { documentoPath } });
    return { ok: true };
  }

  /** Caminho absoluto do documento do próprio cliente (para stream autenticado). */
  async caminhoDocumento(clienteId: number): Promise<string> {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente?.documentoPath) {
      throw new NotFoundException('Nenhum documento enviado');
    }
    return join(process.cwd(), cliente.documentoPath);
  }
}
