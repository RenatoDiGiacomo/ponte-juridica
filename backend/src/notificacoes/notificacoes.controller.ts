import { Controller, Get, Patch, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificacoesService, UsuarioTipo } from './notificacoes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

type Usuario = { id: number; tipo: UsuarioTipo };

@ApiTags('notificacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/notificacoes')
export class NotificacoesController {
  constructor(private notificacoes: NotificacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as notificações do usuário logado (até 50, recentes primeiro)' })
  listar(@UsuarioAtual() u: Usuario) {
    return this.notificacoes.listar(u.id, u.tipo);
  }

  @Get('nao-lidas')
  @ApiOperation({ summary: 'Total de notificações não lidas' })
  async naoLidas(@UsuarioAtual() u: Usuario) {
    const total = await this.notificacoes.contarNaoLidas(u.id, u.tipo);
    return { total };
  }

  @Patch('lidas')
  @ApiOperation({ summary: 'Marca todas como lidas' })
  marcarTodas(@UsuarioAtual() u: Usuario) {
    return this.notificacoes.marcarTodasLidas(u.id, u.tipo);
  }

  @Patch(':id/lida')
  @ApiOperation({ summary: 'Marca uma notificação como lida' })
  marcar(@UsuarioAtual() u: Usuario, @Param('id', ParseIntPipe) id: number) {
    return this.notificacoes.marcarLida(id, u.id, u.tipo);
  }
}
