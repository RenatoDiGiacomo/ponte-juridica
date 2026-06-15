import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProcessosService } from './processos.service';
import { CriarProcessoDto } from './dto/criar-processo.dto';
import { CriarPropostaDto } from './dto/criar-proposta.dto';
import { CriarRelatorioDto } from './dto/criar-relatorio.dto';
import { OportunidadesQueryDto } from './dto/oportunidades-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

type Usuario = { id: number; tipo: 'cliente' | 'advogado' };

function exigirCliente(u: Usuario) {
  if (u.tipo !== 'cliente') throw new ForbiddenException('Acesso restrito a clientes');
}
function exigirAdvogado(u: Usuario) {
  if (u.tipo !== 'advogado') throw new ForbiddenException('Acesso restrito a advogados');
}

@ApiTags('processos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class ProcessosController {
  constructor(private processos: ProcessosService) {}

  @Post('processos')
  @ApiOperation({ summary: 'Cliente cria um novo processo (caso jurídico)' })
  criar(@UsuarioAtual() u: Usuario, @Body() dto: CriarProcessoDto) {
    exigirCliente(u);
    return this.processos.criar(u.id, dto);
  }

  @Get('processos/meus')
  @ApiOperation({ summary: 'Listar processos do cliente logado (com propostas recebidas)' })
  meus(@UsuarioAtual() u: Usuario) {
    exigirCliente(u);
    return this.processos.meusProcessos(u.id);
  }

  @Get('processos/meus/pendentes')
  @ApiOperation({ summary: 'Total de propostas pendentes em casos abertos do cliente' })
  async pendentes(@UsuarioAtual() u: Usuario) {
    exigirCliente(u);
    const total = await this.processos.contarPropostasPendentes(u.id);
    return { total };
  }

  @Get('processos')
  @ApiOperation({
    summary: 'Oportunidades do advogado (default: suas áreas; filtros tempo/região; paginado)',
  })
  abertos(@UsuarioAtual() u: Usuario, @Query() q: OportunidadesQueryDto) {
    exigirAdvogado(u);
    return this.processos.listarAbertos(u.id, q);
  }

  @Get('propostas/quota')
  @ApiOperation({ summary: 'Quota mensal de propostas do advogado logado (por plano)' })
  quota(@UsuarioAtual() u: Usuario) {
    exigirAdvogado(u);
    return this.processos.quotaMensal(u.id);
  }

  @Get('processos/:id')
  @ApiOperation({ summary: 'Detalhe de um processo' })
  detalhe(@Param('id', ParseIntPipe) id: number) {
    return this.processos.findOne(id);
  }

  @Delete('processos/:id')
  @ApiOperation({ summary: 'Cliente remove (soft delete) o próprio processo' })
  remover(@UsuarioAtual() u: Usuario, @Param('id', ParseIntPipe) id: number) {
    exigirCliente(u);
    return this.processos.remover(id, u.id);
  }

  @Post('processos/:id/propostas')
  @ApiOperation({ summary: 'Advogado envia proposta para um processo aberto' })
  enviarProposta(
    @UsuarioAtual() u: Usuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CriarPropostaDto,
  ) {
    exigirAdvogado(u);
    return this.processos.criarProposta(id, u.id, dto);
  }

  @Patch('propostas/:id/aceitar')
  @ApiOperation({ summary: 'Cliente aceita uma proposta (cria vínculo, encerra outras)' })
  aceitar(@UsuarioAtual() u: Usuario, @Param('id', ParseIntPipe) id: number) {
    exigirCliente(u);
    return this.processos.aceitarProposta(id, u.id);
  }

  @Patch('propostas/:id/recusar')
  @ApiOperation({ summary: 'Cliente recusa uma proposta' })
  recusar(@UsuarioAtual() u: Usuario, @Param('id', ParseIntPipe) id: number) {
    exigirCliente(u);
    return this.processos.recusarProposta(id, u.id);
  }

  @Patch('processos/:id/encerrar')
  @ApiOperation({ summary: 'Encerrar caso (cliente dono OU advogado responsável)' })
  encerrar(@UsuarioAtual() u: Usuario, @Param('id', ParseIntPipe) id: number) {
    return this.processos.encerrarCaso(id, u);
  }

  @Get('processos/advogado/meus-casos')
  @ApiOperation({ summary: 'Casos em que o advogado logado está envolvido (com relatórios)' })
  meusCasosAdvogado(@UsuarioAtual() u: Usuario) {
    exigirAdvogado(u);
    return this.processos.meusCasosAdvogado(u.id);
  }

  @Post('processos/:id/relatorios')
  @ApiOperation({ summary: 'Advogado responsável registra um relatório de situação' })
  criarRelatorio(
    @UsuarioAtual() u: Usuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CriarRelatorioDto,
  ) {
    exigirAdvogado(u);
    return this.processos.adicionarRelatorio(id, u.id, dto.texto);
  }
}
