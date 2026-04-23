import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdvogadosService } from './advogados.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@ApiTags('advogados')
@Controller('api/v1/advogados')
export class AdvogadosController {
  constructor(private advogados: AdvogadosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar advogados disponíveis (com filtro por especialização)' })
  @ApiQuery({ name: 'especializacao', required: false })
  findAll(@Query('especializacao') especializacao?: string) {
    return this.advogados.findAll(especializacao);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil completo do advogado logado' })
  meuPerfil(@UsuarioAtual() usuario: { id: number }) {
    return this.advogados.findPerfil(usuario.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver perfil público de um advogado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.advogados.findOne(id);
  }
}
