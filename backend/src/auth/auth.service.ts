import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterClienteDto } from './dto/register-cliente.dto';
import { RegisterAdvogadoDto } from './dto/register-advogado.dto';
import { SolicitarResetDto, RedefinirSenhaDto } from './dto/reset-senha.dto';

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
        id: true, nome: true, email: true, oab: true,
        dataCadastro: true, plano: { select: { id: true, nome: true } },
      },
    });
    if (!a) throw new UnauthorizedException();
    return { ...a, tipo: 'advogado' as const };
  }

  /**
   * Solicita redefinição de senha. Gera token com validade de 30min.
   * MODO DEMO: como não há envio de e-mail configurado, o token é retornado na
   * resposta para permitir concluir o fluxo. Não revela se o e-mail existe.
   */
  async solicitarReset(dto: SolicitarResetDto) {
    const usuario =
      dto.tipo === 'cliente'
        ? await this.prisma.cliente.findFirst({ where: { email: dto.email, softDelete: false } })
        : await this.prisma.advogado.findFirst({ where: { email: dto.email, softDelete: false } });

    // Resposta neutra (não vaza existência do e-mail).
    if (!usuario) return { enviado: true };

    const token = randomBytes(24).toString('hex');
    const expiraEm = new Date(Date.now() + 30 * 60_000);
    await this.prisma.passwordReset.create({
      data: { email: dto.email, tipo: dto.tipo, token, expiraEm },
    });
    // token exposto só por ser demo (sem SMTP).
    return { enviado: true, token };
  }

  /** Redefine a senha a partir de um token válido e não usado. */
  async redefinirSenha(dto: RedefinirSenhaDto) {
    const reset = await this.prisma.passwordReset.findUnique({ where: { token: dto.token } });
    if (!reset || reset.usado || reset.expiraEm < new Date())
      throw new BadRequestException('Token inválido ou expirado');

    const senha = await bcrypt.hash(dto.senha, 10);
    if (reset.tipo === 'cliente') {
      await this.prisma.cliente.updateMany({ where: { email: reset.email }, data: { senha } });
    } else {
      await this.prisma.advogado.updateMany({ where: { email: reset.email }, data: { senha } });
    }
    await this.prisma.passwordReset.update({ where: { id: reset.id }, data: { usado: true } });
    return { ok: true };
  }

  async registrarAdvogado(dto: RegisterAdvogadoDto) {
    const existe = await this.prisma.advogado.findFirst({ where: { email: dto.email } });
    if (existe) throw new ConflictException('E-mail já cadastrado');
    const nomes = [...new Set(dto.areas)];
    const areas = await this.prisma.area.findMany({ where: { nome: { in: nomes } } });
    if (areas.length !== nomes.length)
      throw new BadRequestException('Área de atuação inválida');
    const senha = await bcrypt.hash(dto.senha, 10);
    const { areas: _areas, ...resto } = dto;
    const advogado = await this.prisma.advogado.create({
      data: {
        ...resto,
        senha,
        areas: { create: areas.map((a) => ({ area: { connect: { id: a.id } } })) },
      },
      select: { id: true, nome: true, email: true, oab: true },
    });
    return advogado;
  }
}
