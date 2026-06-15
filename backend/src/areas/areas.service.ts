import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AreasService {
  constructor(private prisma: PrismaService) {}

  /** Lista controlada de áreas de atuação (seedada). */
  listar() {
    return this.prisma.area.findMany({
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });
  }
}
