import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarPerfilClienteDto } from './dto/cliente-perfil.dto';

const SELECT_PERFIL = {
  id: true,
  nome: true,
  email: true,
  documento: true,
  dataNascimento: true,
  fotoPath: true,
  documentoPath: true,
  telefone: true,
  enderecoLogradouro: true,
  enderecoNumero: true,
  enderecoBairro: true,
  enderecoCidade: true,
  enderecoEstado: true,
  enderecoCep: true,
} as const;

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  /** Perfil do PRÓPRIO cliente — todos os campos (é o dono). `temDocumento` em vez do caminho. */
  async findPerfil(id: number) {
    const c = await this.prisma.cliente.findFirst({
      where: { id, softDelete: false },
      select: SELECT_PERFIL,
    });
    if (!c) throw new NotFoundException('Cliente não encontrado');
    const { documentoPath, ...resto } = c;
    return { ...resto, temDocumento: !!documentoPath };
  }

  async atualizarPerfil(id: number, dto: AtualizarPerfilClienteDto) {
    // Campos opcionais que aceitam null (podem ser limpos). Os obrigatórios
    // (nome/email/documento) nunca viram null. Datas '' viram null, não '' cru.
    const NULAVEIS = new Set([
      'dataNascimento', 'telefone', 'enderecoLogradouro', 'enderecoNumero',
      'enderecoBairro', 'enderecoCidade', 'enderecoEstado', 'enderecoCep',
    ]);
    const data: Prisma.ClienteUpdateInput = {};
    for (const [chave, valor] of Object.entries(dto)) {
      if (valor === undefined) continue;
      if (chave === 'dataNascimento') {
        // '' → null; data válida → Date; evita o Prisma receber string vazia num campo DateTime
        (data as Record<string, unknown>).dataNascimento = valor ? new Date(valor as string) : null;
      } else if (valor === '' && NULAVEIS.has(chave)) {
        (data as Record<string, unknown>)[chave] = null;
      } else {
        (data as Record<string, unknown>)[chave] = valor;
      }
    }
    try {
      await this.prisma.cliente.update({ where: { id }, data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw e;
    }
    return this.findPerfil(id);
  }
}
