import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { AtualizarPerfilClienteDto } from './dto/cliente-perfil.dto';

@ApiTags('clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/clientes')
export class ClientesController {
  constructor(private clientes: ClientesService) {}

  @Get('perfil')
  @ApiOperation({ summary: 'Perfil completo do próprio cliente' })
  meuPerfil(@UsuarioAtual() u: { id: number }) {
    return this.clientes.findPerfil(u.id);
  }

  @Patch('perfil')
  @ApiOperation({ summary: 'Atualizar o próprio perfil (dados públicos e privados)' })
  atualizar(@UsuarioAtual() u: { id: number }, @Body() dto: AtualizarPerfilClienteDto) {
    return this.clientes.atualizarPerfil(u.id, dto);
  }
}
