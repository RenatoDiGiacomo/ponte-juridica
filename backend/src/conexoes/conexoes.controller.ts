import { Controller, Post, Get, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConexoesService } from './conexoes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@ApiTags('conexoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/conexoes')
export class ConexoesController {
  constructor(private conexoes: ConexoesService) {}

  @Post(':advogadoId')
  @ApiOperation({ summary: 'Cliente solicita vínculo com advogado' })
  conectar(
    @UsuarioAtual() usuario: { id: number },
    @Param('advogadoId', ParseIntPipe) advogadoId: number,
  ) {
    return this.conexoes.conectar(usuario.id, advogadoId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar advogados vinculados ao cliente logado' })
  minhasConexoes(@UsuarioAtual() usuario: { id: number }) {
    return this.conexoes.minhasConexoes(usuario.id);
  }

  @Get('clientes')
  @ApiOperation({ summary: 'Listar clientes vinculados ao advogado logado' })
  meusClientes(@UsuarioAtual() usuario: { id: number }) {
    return this.conexoes.meusClientes(usuario.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover vínculo (soft delete)' })
  desconectar(@Param('id', ParseIntPipe) id: number) {
    return this.conexoes.desconectar(id);
  }
}
