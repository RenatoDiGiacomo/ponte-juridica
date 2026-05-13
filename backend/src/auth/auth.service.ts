import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterClienteDto } from './dto/register-cliente.dto';
import { RegisterAdvogadoDto } from './dto/register-advogado.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async loginCliente(dto: LoginDto) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { email: dto.email, softDelete: false },
    });
    if (!cliente || !(await bcrypt.compare(dto.senha, cliente.senha))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return { access_token: this.jwt.sign({ sub: cliente.id, tipo: 'cliente' }) };
  }

  async loginAdvogado(dto: LoginDto) {
    const advogado = await this.prisma.advogado.findFirst({
      where: { email: dto.email, softDelete: false },
    });
    if (!advogado || !(await bcrypt.compare(dto.senha, advogado.senha))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return { access_token: this.jwt.sign({ sub: advogado.id, tipo: 'advogado' }) };
  }

  async registrarCliente(dto: RegisterClienteDto) {
    const existe = await this.prisma.cliente.findFirst({ where: { email: dto.email } });
    if (existe) throw new ConflictException('E-mail já cadastrado');
    const senha = await bcrypt.hash(dto.senha, 10);
    const cliente = await this.prisma.cliente.create({
      data: { ...dto, senha },
      select: { id: true, nome: true, email: true, dataCadastro: true },
    });
    return cliente;
  }

  async me(usuarioId: number, tipo: 'cliente' | 'advogado') {
    if (tipo === 'cliente') {
      const c = await this.prisma.cliente.findFirst({
        where: { id: usuarioId, softDelete: false },
        select: { id: true, nome: true, email: true, documento: true, dataCadastro: true },
      });
      if (!c) throw new UnauthorizedException();
      return { ...c, tipo: 'cliente' as const };
    }
    const a = await this.prisma.advogado.findFirst({
      where: { id: usuarioId, softDelete: false },
      select: {
        id: true, nome: true, email: true, oab: true, especializacao: true,
        dataCadastro: true, plano: { select: { id: true, nome: true } },
      },
    });
    if (!a) throw new UnauthorizedException();
    return { ...a, tipo: 'advogado' as const };
  }

  async registrarAdvogado(dto: RegisterAdvogadoDto) {
    const existe = await this.prisma.advogado.findFirst({ where: { email: dto.email } });
    if (existe) throw new ConflictException('E-mail já cadastrado');
    const senha = await bcrypt.hash(dto.senha, 10);
    const advogado = await this.prisma.advogado.create({
      data: { ...dto, senha },
      select: { id: true, nome: true, email: true, oab: true, especializacao: true },
    });
    return advogado;
  }
}
