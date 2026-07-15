import { Controller, Post, Get, Body, Param, UseGuards, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AvaliacoesService } from './avaliacoes.service';
import { CriarAvaliacaoDto } from './dto/criar-avaliacao.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

type Usuario = { id: number; tipo: 'cliente' | 'advogado' };

@ApiTags('avaliacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/avaliacoes')
export class AvaliacoesController {
  constructor(private avaliacoes: AvaliacoesService) {}

  @Post()
  @ApiOperation({ summary: 'Cliente avalia o advogado de um caso encerrado' })
  criar(@UsuarioAtual() u: Usuario, @Body() dto: CriarAvaliacaoDto) {
    if (u.tipo !== 'cliente') throw new ForbiddenException('Apenas clientes avaliam');
    return this.avaliacoes.criar(u.id, dto);
  }

  @Get('advogado/:id')
  @ApiOperation({ summary: 'Avaliações e média de um advogado' })
  porAdvogado(@Param('id', ParseIntPipe) id: number) {
    return this.avaliacoes.listarPorAdvogado(id);
  }
}
