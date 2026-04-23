import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.plano.findMany({
      where: { softDelete: false },
      orderBy: { valorMensal: 'asc' },
    });
  }
}
